import { DbdEntry, DbdIndexStats, MemorySegment } from '../types/virtualComputer';

export const RAM_SIZE = 1024; // 1024 16-bit words (0x0000 - 0x03FF)

export const MEMORY_SEGMENTS: MemorySegment[] = [
  {
    name: 'Table des Vecteurs d\'Interruption (IVT)',
    start: 0x0000,
    end: 0x000f,
    color: 'emerald',
    description: 'Adresses des gestionnaires d\'interruptions (Timer IRQ0, Clavier IRQ1, Disque IRQ2, Syscall INT)',
  },
  {
    name: 'Noyau & Gestionnaires Kernel',
    start: 0x0010,
    end: 0x007f,
    color: 'cyan',
    description: 'Code bas-niveau du système d\'exploitation, ISR et routines système',
  },
  {
    name: 'Programme Utilisateur / Code',
    start: 0x0080,
    end: 0x01bf,
    color: 'blue',
    description: 'Instructions séquentielles injectées exécutées par le CPU',
  },
  {
    name: 'Index DBD Optimisé (RAM B-Tree)',
    start: 0x01c0,
    end: 0x027f,
    color: 'amber',
    description: 'Structure d\'index en mémoire vive avec nœuds [Key, Ptr, Left, Right] pour recherche rapide O(log N)',
  },
  {
    name: 'Données & Buffers E/S',
    start: 0x0280,
    end: 0x033f,
    color: 'indigo',
    description: 'Enregistrements DBD, chaînes de caractères, tampon clavier et variables globales',
  },
  {
    name: 'Pile d\'Exécution (Stack)',
    start: 0x0340,
    end: 0x03bf,
    color: 'rose',
    description: 'Pile LIFO croissante vers le bas pour CALL/RET, PUSH/POP et contextes d\'interruption',
  },
  {
    name: 'Registres Mappés & Contrôle E/S',
    start: 0x03c0,
    end: 0x03ff,
    color: 'purple',
    description: 'Registres périphériques mappés en mémoire (VRAM X/Y, état Timer, registre statut)',
  },
];

export const DBD_BASE_ADDR = 0x01c0;
export const DBD_HEADER_MAGIC = 0xdbd1;
export const DBD_MAX_NODES = 24;
export const DBD_NODE_WORDS = 4; // Key, RecordPtr, LeftChild, RightChild

export class VirtualMemory {
  public ram: Int32Array;
  public stats: DbdIndexStats;

  constructor() {
    this.ram = new Int32Array(RAM_SIZE);
    this.stats = {
      rootIndex: -1,
      count: 0,
      capacity: DBD_MAX_NODES,
      lookupsCount: 0,
      lastLookupKey: null,
      lastLookupSteps: 0,
      lastFound: false,
      baseAddress: DBD_BASE_ADDR,
    };
    this.reset();
  }

  public reset(): void {
    this.ram.fill(0);
    this.initDbdHeader();
    this.stats.lookupsCount = 0;
    this.stats.lastLookupKey = null;
    this.stats.lastLookupSteps = 0;
    this.stats.lastFound = false;
  }

  public read(address: number): number {
    const addr = address & (RAM_SIZE - 1);
    return this.ram[addr];
  }

  public write(address: number, value: number): void {
    const addr = address & (RAM_SIZE - 1);
    // 16-bit signed clamping (-32768 to 32767)
    let val = value & 0xffff;
    if (val >= 0x8000) val -= 0x10000;
    this.ram[addr] = val;
  }

  // --- Optimized In-Memory DBD Index Structure ---

  public initDbdHeader(): void {
    this.ram[DBD_BASE_ADDR] = DBD_HEADER_MAGIC; // Magic
    this.ram[DBD_BASE_ADDR + 1] = 0;             // Active entry count
    this.ram[DBD_BASE_ADDR + 2] = DBD_MAX_NODES; // Capacity
    this.ram[DBD_BASE_ADDR + 3] = -1;            // Root node index (-1 = empty)

    // Clear node area
    for (let i = 0; i < DBD_MAX_NODES * DBD_NODE_WORDS; i++) {
      this.ram[DBD_BASE_ADDR + 4 + i] = 0;
    }

    this.stats.rootIndex = -1;
    this.stats.count = 0;
  }

  /**
   * Insert a key and record pointer into the in-memory binary search index in RAM
   */
  public dbdInsert(key: number, recordPointer: number): boolean {
    let count = this.ram[DBD_BASE_ADDR + 1];
    if (count >= DBD_MAX_NODES) {
      return false; // Out of index capacity
    }

    const newNodeIndex = count;
    const nodeAddr = DBD_BASE_ADDR + 4 + newNodeIndex * DBD_NODE_WORDS;

    // Write new node in RAM
    this.ram[nodeAddr + 0] = key;             // Key
    this.ram[nodeAddr + 1] = recordPointer;   // Record pointer
    this.ram[nodeAddr + 2] = -1;              // Left child
    this.ram[nodeAddr + 3] = -1;              // Right child

    let rootIndex = this.ram[DBD_BASE_ADDR + 3];

    if (rootIndex === -1) {
      // Tree was empty, this is the root
      this.ram[DBD_BASE_ADDR + 3] = newNodeIndex;
      this.stats.rootIndex = newNodeIndex;
    } else {
      // Traverse to find insertion point
      let currentIdx = rootIndex;
      while (true) {
        const curAddr = DBD_BASE_ADDR + 4 + currentIdx * DBD_NODE_WORDS;
        const curKey = this.ram[curAddr + 0];

        if (key === curKey) {
          // Key already exists, update record pointer
          this.ram[curAddr + 1] = recordPointer;
          return true;
        } else if (key < curKey) {
          const left = this.ram[curAddr + 2];
          if (left === -1) {
            this.ram[curAddr + 2] = newNodeIndex;
            break;
          }
          currentIdx = left;
        } else {
          const right = this.ram[curAddr + 3];
          if (right === -1) {
            this.ram[curAddr + 3] = newNodeIndex;
            break;
          }
          currentIdx = right;
        }
      }
    }

    count++;
    this.ram[DBD_BASE_ADDR + 1] = count;
    this.stats.count = count;
    return true;
  }

  /**
   * Look up a key in the memory DBD index using fast binary tree traversal
   * Returns recordPointer or -1 if not found.
   */
  public dbdLookup(key: number): { recordPointer: number; steps: number; found: boolean } {
    this.stats.lookupsCount++;
    this.stats.lastLookupKey = key;

    const rootIndex = this.ram[DBD_BASE_ADDR + 3];
    if (rootIndex === -1) {
      this.stats.lastLookupSteps = 0;
      this.stats.lastFound = false;
      return { recordPointer: -1, steps: 0, found: false };
    }

    let currentIdx = rootIndex;
    let steps = 0;

    while (currentIdx >= 0 && currentIdx < DBD_MAX_NODES) {
      steps++;
      const curAddr = DBD_BASE_ADDR + 4 + currentIdx * DBD_NODE_WORDS;
      const curKey = this.ram[curAddr + 0];

      if (curKey === key) {
        const recordPointer = this.ram[curAddr + 1];
        this.stats.lastLookupSteps = steps;
        this.stats.lastFound = true;
        return { recordPointer, steps, found: true };
      } else if (key < curKey) {
        currentIdx = this.ram[curAddr + 2];
      } else {
        currentIdx = this.ram[curAddr + 3];
      }
    }

    this.stats.lastLookupSteps = steps;
    this.stats.lastFound = false;
    return { recordPointer: -1, steps, found: false };
  }

  /**
   * Retrieve list of all structured DBD nodes from RAM for visualizer
   */
  public getDbdEntries(): DbdEntry[] {
    const count = this.ram[DBD_BASE_ADDR + 1];
    const entries: DbdEntry[] = [];

    for (let i = 0; i < count; i++) {
      const ramAddr = DBD_BASE_ADDR + 4 + i * DBD_NODE_WORDS;
      entries.push({
        index: i,
        ramAddress: ramAddr,
        key: this.ram[ramAddr + 0],
        recordPointer: this.ram[ramAddr + 1],
        leftChild: this.ram[ramAddr + 2],
        rightChild: this.ram[ramAddr + 3],
        flags: 1,
      });
    }

    return entries;
  }
}
