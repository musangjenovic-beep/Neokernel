import {
  AluState,
  CpuFlags,
  CpuRegisters,
  Instruction,
  MachineCyclePhase,
  VirtualComputerState,
} from '../types/virtualComputer';
import { VirtualMemory, RAM_SIZE } from './memory';

export const SCREEN_WIDTH = 32;
export const SCREEN_HEIGHT = 32;

export const COLOR_PALETTE = [
  '#090d16', // 0: Noir profond (Background)
  '#1e293b', // 1: Bleu ardoise foncé
  '#4338ca', // 2: Indigo foncé
  '#047857', // 3: Vert émeraude sombre
  '#9a3412', // 4: Brun rouille
  '#475569', // 5: Gris moyen
  '#94a3b8', // 6: Gris clair
  '#f8fafc', // 7: Blanc éclatant
  '#ef4444', // 8: Rouge vif
  '#f97316', // 9: Orange
  '#eab308', // 10: Jaune
  '#10b981', // 11: Vert vif
  '#06b6d4', // 12: Cyan
  '#6366f1', // 13: Indigo vif
  '#ec4899', // 14: Rose
  '#fde047', // 15: Jaune pastel
];

export const FONT_3X5: Record<string, number[]> = {
  'A': [0b111, 0b101, 0b111, 0b101, 0b101],
  'B': [0b110, 0b101, 0b110, 0b101, 0b110],
  'C': [0b111, 0b100, 0b100, 0b100, 0b111],
  'D': [0b110, 0b101, 0b101, 0b101, 0b110],
  'E': [0b111, 0b100, 0b110, 0b100, 0b111],
  'F': [0b111, 0b100, 0b110, 0b100, 0b100],
  'G': [0b111, 0b100, 0b101, 0b101, 0b111],
  'H': [0b101, 0b101, 0b111, 0b101, 0b101],
  'I': [0b111, 0b010, 0b010, 0b010, 0b111],
  'J': [0b001, 0b001, 0b001, 0b101, 0b111],
  'K': [0b101, 0b110, 0b100, 0b110, 0b101],
  'L': [0b100, 0b100, 0b100, 0b100, 0b111],
  'M': [0b101, 0b111, 0b101, 0b101, 0b101],
  'N': [0b111, 0b101, 0b101, 0b101, 0b101],
  'O': [0b111, 0b101, 0b101, 0b101, 0b111],
  'P': [0b111, 0b101, 0b111, 0b100, 0b100],
  'Q': [0b111, 0b101, 0b101, 0b111, 0b001],
  'R': [0b110, 0b101, 0b110, 0b101, 0b101],
  'S': [0b111, 0b100, 0b111, 0b001, 0b111],
  'T': [0b111, 0b010, 0b010, 0b010, 0b010],
  'U': [0b101, 0b101, 0b101, 0b101, 0b111],
  'V': [0b101, 0b101, 0b101, 0b101, 0b010],
  'W': [0b101, 0b101, 0b101, 0b111, 0b101],
  'X': [0b101, 0b101, 0b010, 0b101, 0b101],
  'Y': [0b101, 0b101, 0b111, 0b010, 0b010],
  'Z': [0b111, 0b001, 0b010, 0b100, 0b111],
  ' ': [0b000, 0b000, 0b000, 0b000, 0b000],
  '!': [0b010, 0b010, 0b010, 0b000, 0b010],
  '?': [0b111, 0b001, 0b010, 0b000, 0b010],
  '.': [0b000, 0b000, 0b000, 0b000, 0b010],
  '-': [0b000, 0b000, 0b111, 0b000, 0b000],
  '0': [0b111, 0b101, 0b101, 0b101, 0b111],
  '1': [0b010, 0b110, 0b010, 0b010, 0b111],
  '2': [0b111, 0b001, 0b111, 0b100, 0b111],
  '3': [0b111, 0b001, 0b111, 0b001, 0b111],
  '4': [0b101, 0b101, 0b111, 0b001, 0b001],
  '5': [0b111, 0b100, 0b111, 0b001, 0b111],
  '6': [0b111, 0b100, 0b111, 0b101, 0b111],
  '7': [0b111, 0b001, 0b010, 0b010, 0b010],
  '8': [0b111, 0b101, 0b111, 0b101, 0b111],
  '9': [0b111, 0b101, 0b111, 0b001, 0b111],
};

export interface DiskStorage {
  sectors: number[][]; // 8 sectors x 64 words
}

export class VirtualComputer {
  public memory: VirtualMemory;
  public registers: CpuRegisters;
  public flags: CpuFlags;
  public alu: AluState;
  public cyclePhase: MachineCyclePhase;
  public instructions: Instruction[]; // Loaded instruction program
  public isRunning: boolean;
  public clockSpeedHz: number;
  public cycleCount: number;
  public instructionsCount: number;
  public lastError: string | null;

  // Peripherals
  public screenBuffer: Uint8Array; // 32x32 pixel palette indices (0-15)
  public screenChanged: boolean;
  public keyboardBuffer: number[]; // Queue of ASCII / scan codes
  public timerInterval: number; // in cycles
  public timerCounter: number;
  public timerEnabled: boolean;
  public disk: DiskStorage;

  // Interrupt Pending Latches
  public irq0Pending: boolean; // Timer
  public irq1Pending: boolean; // Keyboard
  public irq2Pending: boolean; // Disk
  public swiVector: number | null; // Software interrupt vector

  // I/O Ports
  public ioPorts: number[];

  // Event callbacks for UI
  public onOutputLog?: (msg: string) => void;

  constructor() {
    this.memory = new VirtualMemory();
    this.registers = {
      PC: 0x0080, // Default user code starting address
      SP: 0x03bf, // Stack top
      R0: 0,
      R1: 0,
      R2: 0,
      R3: 0,
      A: 0,
      B: 0,
      IX: 0,
      IR: 'NOP',
    };
    this.flags = {
      zero: false,
      sign: false,
      carry: false,
      overflow: false,
      interrupts: true,
    };
    this.alu = {
      operation: 'NONE',
      operandA: 0,
      operandB: 0,
      result: 0,
      active: false,
    };
    this.cyclePhase = 'FETCH';
    this.instructions = [];
    this.isRunning = false;
    this.clockSpeedHz = 20; // Default 20 Hz
    this.cycleCount = 0;
    this.instructionsCount = 0;
    this.lastError = null;

    // Peripherals init
    this.screenBuffer = new Uint8Array(SCREEN_WIDTH * SCREEN_HEIGHT);
    this.screenChanged = true;
    this.keyboardBuffer = [];
    this.timerInterval = 40; // Every 40 cycles trigger IRQ0
    this.timerCounter = 0;
    this.timerEnabled = true;

    // 8 sectors of 64 words each
    this.disk = {
      sectors: Array.from({ length: 8 }, () => new Array(64).fill(0)),
    };

    this.irq0Pending = false;
    this.irq1Pending = false;
    this.irq2Pending = false;
    this.swiVector = null;

    this.ioPorts = new Array(8).fill(0);
  }

  /**
   * Hard reset CPU, memory, registers, and peripherals
   */
  public reset(keepProgram: boolean = true): void {
    this.memory.reset();
    this.registers = {
      PC: 0x0080,
      SP: 0x03bf,
      R0: 0,
      R1: 0,
      R2: 0,
      R3: 0,
      A: 0,
      B: 0,
      IX: 0,
      IR: 'NOP',
    };
    this.flags = {
      zero: false,
      sign: false,
      carry: false,
      overflow: false,
      interrupts: true,
    };
    this.alu = {
      operation: 'NONE',
      operandA: 0,
      operandB: 0,
      result: 0,
      active: false,
    };
    this.cyclePhase = 'FETCH';
    this.isRunning = false;
    this.cycleCount = 0;
    this.instructionsCount = 0;
    this.lastError = null;

    this.screenBuffer.fill(0);
    this.screenChanged = true;
    this.keyboardBuffer = [];
    this.timerCounter = 0;
    this.irq0Pending = false;
    this.irq1Pending = false;
    this.irq2Pending = false;
    this.swiVector = null;
    this.ioPorts.fill(0);

    // If IVT in RAM has reset vector at 0x0000, jump to it
    const bootVector = this.memory.read(0x0000);
    if (bootVector > 0 && bootVector < RAM_SIZE) {
      this.registers.PC = bootVector;
    }
  }

  /**
   * Load JSON instructions into the virtual computer
   */
  public loadProgram(instructions: Instruction[], baseAddr: number = 0x0080): void {
    this.instructions = [...instructions];
    this.registers.PC = baseAddr;
    this.cyclePhase = 'FETCH';
    this.lastError = null;
  }

  /**
   * Push a key press event into the hardware keyboard queue and trigger IRQ1
   */
  public pushKey(keyCode: number): void {
    this.keyboardBuffer.push(keyCode);
    if (this.keyboardBuffer.length > 32) {
      this.keyboardBuffer.shift(); // circular buffer
    }
    this.irq1Pending = true;
  }

  /**
   * Execute a single micro-cycle phase (FETCH -> DECODE -> EXECUTE -> WRITEBACK -> IRQ)
   */
  public stepCycle(): boolean {
    if (this.cyclePhase === 'HALTED') {
      return false;
    }

    this.cycleCount++;

    // Increment hardware timer
    if (this.timerEnabled) {
      this.timerCounter++;
      if (this.timerCounter >= this.timerInterval) {
        this.timerCounter = 0;
        this.irq0Pending = true;
      }
    }

    switch (this.cyclePhase) {
      case 'FETCH':
        this.phaseFetch();
        this.cyclePhase = 'DECODE';
        break;

      case 'DECODE':
        this.phaseDecode();
        this.cyclePhase = 'EXECUTE';
        break;

      case 'EXECUTE':
        this.phaseExecute();
        if ((this.cyclePhase as string) !== 'HALTED') {
          this.cyclePhase = 'WRITEBACK';
        }
        break;

      case 'WRITEBACK':
        this.phaseWriteback();
        if ((this.cyclePhase as string) !== 'HALTED') {
          this.cyclePhase = 'INTERRUPT_CHECK';
        }
        break;

      case 'INTERRUPT_CHECK':
        this.phaseInterruptCheck();
        if ((this.cyclePhase as string) !== 'HALTED') {
          this.cyclePhase = 'FETCH';
        }
        break;
    }

    return (this.cyclePhase as string) !== 'HALTED';
  }

  /**
   * Execute an entire instruction (all 5 micro-phases until the next FETCH)
   */
  public stepInstruction(): boolean {
    if ((this.cyclePhase as string) === 'HALTED') return false;

    let iterations = 0;
    do {
      const ok = this.stepCycle();
      iterations++;
      if (!ok || iterations > 10) break;
    } while (this.cyclePhase !== 'FETCH');

    return (this.cyclePhase as string) !== 'HALTED';
  }

  // --- Machine Cycle Phases ---

  private currentInst: Instruction | null = null;
  private pendingWriteback: { target: string | number; value: number; isMemory?: boolean } | null = null;

  private phaseFetch(): void {
    const pc = this.registers.PC;
    const instIndex = pc - 0x0080;

    if (instIndex >= 0 && instIndex < this.instructions.length) {
      this.currentInst = this.instructions[instIndex];
      this.registers.IR = `${this.currentInst.op} ${this.currentInst.dst || ''} ${this.currentInst.src !== undefined ? this.currentInst.src : ''}`.trim();
    } else {
      // If outside instructions array, treat as NOP or halt if past bounds
      this.currentInst = { op: 'NOP' };
      this.registers.IR = 'NOP';
    }
  }

  private phaseDecode(): void {
    // Decode validates operands and sets up ALU if needed
    if (!this.currentInst) return;
    this.alu.active = false;
  }

  private phaseExecute(): void {
    if (!this.currentInst) return;
    const inst = this.currentInst;

    let nextPC = this.registers.PC + 1;
    this.pendingWriteback = null;

    try {
      switch (inst.op) {
        case 'NOP':
          break;

        case 'HALT':
          this.cyclePhase = 'HALTED';
          this.isRunning = false;
          return;

        case 'MOV': {
          const val = this.resolveValue(inst.src !== undefined ? inst.src : inst.val);
          if (inst.dst) {
            this.pendingWriteback = { target: inst.dst, value: val };
          }
          break;
        }

        case 'LOAD': {
          const addr = inst.addr !== undefined ? inst.addr : this.resolveValue(inst.src);
          const val = this.memory.read(addr);
          if (inst.dst) {
            this.pendingWriteback = { target: inst.dst, value: val };
          }
          break;
        }

        case 'STORE': {
          const addr = inst.addr !== undefined ? inst.addr : this.resolveValue(inst.dst);
          const val = this.resolveValue(inst.src !== undefined ? inst.src : inst.val);
          this.pendingWriteback = { target: addr, value: val, isMemory: true };
          break;
        }

        case 'LOAD_IX': {
          const baseAddr = inst.addr !== undefined ? inst.addr : 0;
          const addr = baseAddr + this.registers.IX;
          const val = this.memory.read(addr);
          if (inst.dst) {
            this.pendingWriteback = { target: inst.dst, value: val };
          }
          break;
        }

        case 'STORE_IX': {
          const baseAddr = inst.addr !== undefined ? inst.addr : 0;
          const addr = baseAddr + this.registers.IX;
          const val = this.resolveValue(inst.src !== undefined ? inst.src : inst.val);
          this.pendingWriteback = { target: addr, value: val, isMemory: true };
          break;
        }

        case 'PUSH': {
          const val = this.resolveValue(inst.dst || inst.src);
          this.registers.SP = (this.registers.SP - 1) & (RAM_SIZE - 1);
          this.memory.write(this.registers.SP, val);
          break;
        }

        case 'POP': {
          const val = this.memory.read(this.registers.SP);
          this.registers.SP = (this.registers.SP + 1) & (RAM_SIZE - 1);
          if (inst.dst) {
            this.pendingWriteback = { target: inst.dst, value: val };
          }
          break;
        }

        case 'ADD':
        case 'SUB':
        case 'MUL':
        case 'DIV':
        case 'MOD':
        case 'AND':
        case 'OR':
        case 'XOR':
        case 'CMP': {
          const opA = this.getRegisterValue(inst.dst || 'A');
          const opB = this.resolveValue(inst.src !== undefined ? inst.src : inst.val);
          const res = this.executeAlu(inst.op, opA, opB);
          if (inst.op !== 'CMP' && inst.dst) {
            this.pendingWriteback = { target: inst.dst, value: res };
          }
          break;
        }

        case 'INC': {
          const reg = inst.dst || 'R0';
          const val = this.getRegisterValue(reg);
          const res = this.executeAlu('ADD', val, 1);
          this.pendingWriteback = { target: reg, value: res };
          break;
        }

        case 'DEC': {
          const reg = inst.dst || 'R0';
          const val = this.getRegisterValue(reg);
          const res = this.executeAlu('SUB', val, 1);
          this.pendingWriteback = { target: reg, value: res };
          break;
        }

        case 'NOT': {
          const reg = inst.dst || 'R0';
          const val = this.getRegisterValue(reg);
          const res = ~val & 0xffff;
          this.pendingWriteback = { target: reg, value: res };
          break;
        }

        case 'SHL': {
          const reg = inst.dst || 'R0';
          const bits = this.resolveValue(inst.src !== undefined ? inst.src : 1);
          const val = this.getRegisterValue(reg);
          const res = (val << bits) & 0xffff;
          this.pendingWriteback = { target: reg, value: res };
          break;
        }

        case 'SHR': {
          const reg = inst.dst || 'R0';
          const bits = this.resolveValue(inst.src !== undefined ? inst.src : 1);
          const val = this.getRegisterValue(reg);
          const res = (val >> bits) & 0xffff;
          this.pendingWriteback = { target: reg, value: res };
          break;
        }

        case 'JMP': {
          nextPC = this.resolveJumpAddress(inst);
          break;
        }

        case 'JZ': {
          if (this.flags.zero) {
            nextPC = this.resolveJumpAddress(inst);
          }
          break;
        }

        case 'JNZ': {
          if (!this.flags.zero) {
            nextPC = this.resolveJumpAddress(inst);
          }
          break;
        }

        case 'JG': {
          if (!this.flags.zero && this.flags.sign === this.flags.overflow) {
            nextPC = this.resolveJumpAddress(inst);
          }
          break;
        }

        case 'JL': {
          if (this.flags.sign !== this.flags.overflow) {
            nextPC = this.resolveJumpAddress(inst);
          }
          break;
        }

        case 'CALL': {
          // Push return address
          this.registers.SP = (this.registers.SP - 1) & (RAM_SIZE - 1);
          this.memory.write(this.registers.SP, nextPC);
          nextPC = this.resolveJumpAddress(inst);
          break;
        }

        case 'RET': {
          nextPC = this.memory.read(this.registers.SP);
          this.registers.SP = (this.registers.SP + 1) & (RAM_SIZE - 1);
          break;
        }

        case 'INT': {
          // Software interrupt
          this.swiVector = inst.vector !== undefined ? inst.vector : 4;
          break;
        }

        case 'RTI': {
          // Return from interrupt
          const packedFlags = this.memory.read(this.registers.SP);
          this.registers.SP = (this.registers.SP + 1) & (RAM_SIZE - 1);
          this.unpackFlags(packedFlags);

          nextPC = this.memory.read(this.registers.SP);
          this.registers.SP = (this.registers.SP + 1) & (RAM_SIZE - 1);
          break;
        }

        case 'CLI': {
          this.flags.interrupts = false;
          break;
        }

        case 'STI': {
          this.flags.interrupts = true;
          break;
        }

        case 'IN': {
          const port = inst.port !== undefined ? inst.port : 0;
          let val = 0;
          if (port === 4) {
            // Keyboard port: pop from keyboard buffer
            val = this.keyboardBuffer.length > 0 ? this.keyboardBuffer.shift()! : 0;
          } else {
            val = this.ioPorts[port & 7];
          }
          if (inst.dst) {
            this.pendingWriteback = { target: inst.dst, value: val };
          }
          break;
        }

        case 'OUT': {
          const port = inst.port !== undefined ? inst.port : 0;
          const val = this.resolveValue(inst.src !== undefined ? inst.src : inst.val);
          this.ioPorts[port & 7] = val;

          // Port 2 triggers draw pixel at (Port 0, Port 1) with color = val
          if (port === 2) {
            const x = this.ioPorts[0] & 31;
            const y = this.ioPorts[1] & 31;
            const color = val & 15;
            this.screenBuffer[y * SCREEN_WIDTH + x] = color;
            this.screenChanged = true;
          } else if (port === 3 && val === 1) {
            // Screen clear command
            this.screenBuffer.fill(this.ioPorts[2] & 15);
            this.screenChanged = true;
          }
          break;
        }

        case 'DRAW_PIXEL': {
          const x = this.resolveValue(inst.dst || 'R0') & 31;
          const y = this.resolveValue(inst.src || 'R1') & 31;
          const color = this.resolveValue(inst.val !== undefined ? inst.val : 'R2') & 15;
          this.screenBuffer[y * SCREEN_WIDTH + x] = color;
          this.screenChanged = true;
          break;
        }

        case 'DRAW_CHAR': {
          const ch = typeof inst.dst === 'string' && inst.dst.length === 1
            ? inst.dst
            : String.fromCharCode(this.resolveValue(inst.dst) || 65);
          const x = this.resolveValue(inst.src || 'R0') & 31;
          const y = this.resolveValue(inst.addr !== undefined ? inst.addr : 'R1') & 31;
          const color = this.resolveValue(inst.val !== undefined ? inst.val : 'R2') & 15;
          this.drawChar(ch, x, y, color);
          break;
        }

        case 'DRAW_TEXT': {
          const text = inst.text || (typeof inst.dst === 'string' && isNaN(Number(inst.dst)) ? inst.dst : 'HELLO');
          const x = this.resolveValue(typeof inst.dst === 'number' ? inst.dst : inst.src !== undefined ? inst.src : 2) & 31;
          const y = this.resolveValue(inst.addr !== undefined ? inst.addr : 2) & 31;
          const color = this.resolveValue(inst.val !== undefined ? inst.val : 12) & 15;
          this.drawText(text, x, y, color);
          break;
        }

        case 'CLEAR_SCREEN': {
          const color = this.resolveValue(inst.val !== undefined ? inst.val : 0) & 15;
          this.screenBuffer.fill(color);
          this.screenChanged = true;
          break;
        }

        case 'DBD_SET': {
          // In-Memory DBD Insert
          const key = this.resolveValue(inst.dst || inst.val);
          const valPtr = this.resolveValue(inst.src || inst.addr || 0);
          this.memory.dbdInsert(key, valPtr);
          break;
        }

        case 'DBD_GET': {
          // In-Memory DBD Lookup
          const key = this.resolveValue(inst.src !== undefined ? inst.src : inst.val);
          const result = this.memory.dbdLookup(key);
          const targetReg = inst.dst || 'R0';
          this.pendingWriteback = { target: targetReg, value: result.found ? result.recordPointer : -1 };
          this.flags.zero = !result.found;
          break;
        }

        case 'DISK_READ': {
          const sector = (inst.port || inst.val || 0) & 7;
          const ramAddr = (inst.addr || 0) & (RAM_SIZE - 1);
          const secData = this.disk.sectors[sector];
          for (let i = 0; i < 64; i++) {
            this.memory.write(ramAddr + i, secData[i]);
          }
          this.irq2Pending = true;
          break;
        }

        case 'DISK_WRITE': {
          const sector = (inst.port || inst.val || 0) & 7;
          const ramAddr = (inst.addr || 0) & (RAM_SIZE - 1);
          const secData = this.disk.sectors[sector];
          for (let i = 0; i < 64; i++) {
            secData[i] = this.memory.read(ramAddr + i);
          }
          this.irq2Pending = true;
          break;
        }
      }

      this.registers.PC = nextPC;
      this.instructionsCount++;
    } catch (err: any) {
      this.lastError = `Erreur CPU: ${err.message}`;
      this.cyclePhase = 'HALTED';
      this.isRunning = false;
    }
  }

  private phaseWriteback(): void {
    if (!this.pendingWriteback) return;

    if (this.pendingWriteback.isMemory) {
      this.memory.write(this.pendingWriteback.target as number, this.pendingWriteback.value);
    } else {
      this.setRegisterValue(this.pendingWriteback.target as string, this.pendingWriteback.value);
    }

    this.pendingWriteback = null;
  }

  private phaseInterruptCheck(): void {
    // Check pending interrupts if interrupts are enabled (or SWI)
    let triggeredVector: number | null = null;

    if (this.swiVector !== null) {
      triggeredVector = this.swiVector;
      this.swiVector = null;
    } else if (this.flags.interrupts) {
      if (this.irq0Pending) {
        triggeredVector = 1; // Vector 1: Timer IRQ0
        this.irq0Pending = false;
      } else if (this.irq1Pending) {
        triggeredVector = 2; // Vector 2: Keyboard IRQ1
        this.irq1Pending = false;
      } else if (this.irq2Pending) {
        triggeredVector = 3; // Vector 3: Disk IRQ2
        this.irq2Pending = false;
      }
    }

    if (triggeredVector !== null) {
      const handlerAddr = this.memory.read(triggeredVector);
      if (handlerAddr > 0 && handlerAddr < RAM_SIZE) {
        // Push current PC
        this.registers.SP = (this.registers.SP - 1) & (RAM_SIZE - 1);
        this.memory.write(this.registers.SP, this.registers.PC);

        // Push current FLAGS
        this.registers.SP = (this.registers.SP - 1) & (RAM_SIZE - 1);
        this.memory.write(this.registers.SP, this.packFlags());

        // Disable interrupts to prevent recursion
        this.flags.interrupts = false;

        // Jump to handler
        this.registers.PC = handlerAddr;
      }
    }
  }

  // --- ALU Subsystem ---

  private executeAlu(op: string, a: number, b: number): number {
    this.alu.active = true;
    this.alu.operation = op;
    this.alu.operandA = a;
    this.alu.operandB = b;

    let res = 0;
    let carry = false;
    let overflow = false;

    switch (op) {
      case 'ADD':
        res = a + b;
        carry = res > 0xffff || res < -0x8000;
        overflow = ((a ^ res) & (b ^ res) & 0x8000) !== 0;
        break;

      case 'SUB':
      case 'CMP':
        res = a - b;
        carry = a < b;
        overflow = ((a ^ b) & (a ^ res) & 0x8000) !== 0;
        break;

      case 'MUL':
        res = a * b;
        break;

      case 'DIV':
        res = b !== 0 ? Math.trunc(a / b) : 0;
        break;

      case 'MOD':
        res = b !== 0 ? a % b : 0;
        break;

      case 'AND':
        res = a & b;
        break;

      case 'OR':
        res = a | b;
        break;

      case 'XOR':
        res = a ^ b;
        break;
    }

    // 16-bit clamp
    let clamped = res & 0xffff;
    if (clamped >= 0x8000) clamped -= 0x10000;

    this.alu.result = clamped;

    // Update flags
    this.flags.zero = clamped === 0;
    this.flags.sign = clamped < 0;
    this.flags.carry = carry;
    this.flags.overflow = overflow;

    return clamped;
  }

  // --- Helpers ---

  public getRegisterValue(reg: string | number): number {
    if (typeof reg === 'number') return reg;
    const r = reg.toUpperCase();
    switch (r) {
      case 'R0': return this.registers.R0;
      case 'R1': return this.registers.R1;
      case 'R2': return this.registers.R2;
      case 'R3': return this.registers.R3;
      case 'A': return this.registers.A;
      case 'B': return this.registers.B;
      case 'IX': return this.registers.IX;
      case 'SP': return this.registers.SP;
      case 'PC': return this.registers.PC;
      default: return 0;
    }
  }

  public setRegisterValue(reg: string, val: number): void {
    const r = reg.toUpperCase();
    let clamped = val & 0xffff;
    if (clamped >= 0x8000) clamped -= 0x10000;

    switch (r) {
      case 'R0': this.registers.R0 = clamped; break;
      case 'R1': this.registers.R1 = clamped; break;
      case 'R2': this.registers.R2 = clamped; break;
      case 'R3': this.registers.R3 = clamped; break;
      case 'A': this.registers.A = clamped; break;
      case 'B': this.registers.B = clamped; break;
      case 'IX': this.registers.IX = clamped; break;
      case 'SP': this.registers.SP = clamped & (RAM_SIZE - 1); break;
      case 'PC': this.registers.PC = clamped & (RAM_SIZE - 1); break;
    }
  }

  public drawChar(char: string, startX: number, startY: number, color: number): void {
    const glyph = FONT_3X5[char.toUpperCase()] || FONT_3X5['?'] || [0b111, 0b101, 0b101, 0b101, 0b111];
    for (let row = 0; row < 5; row++) {
      const py = startY + row;
      if (py < 0 || py >= SCREEN_HEIGHT) continue;
      const bits = glyph[row];
      for (let col = 0; col < 3; col++) {
        const px = startX + col;
        if (px < 0 || px >= SCREEN_WIDTH) continue;
        if ((bits & (1 << (2 - col))) !== 0) {
          this.screenBuffer[py * SCREEN_WIDTH + px] = color & 15;
        }
      }
    }
    this.screenChanged = true;
  }

  public drawText(text: string, startX: number, startY: number, color: number): void {
    let cx = startX;
    let cy = startY;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === '\n') {
        cy += 6;
        cx = startX;
        continue;
      }
      if (cx + 3 > SCREEN_WIDTH) {
        cy += 6;
        cx = startX;
      }
      if (cy + 5 > SCREEN_HEIGHT) break;
      this.drawChar(ch, cx, cy, color);
      cx += 4; // 3 width + 1 spacing
    }
  }

  private resolveValue(arg: string | number | undefined): number {
    if (arg === undefined) return 0;
    if (typeof arg === 'number') return arg;
    if (['R0', 'R1', 'R2', 'R3', 'A', 'B', 'IX', 'SP', 'PC'].includes(arg.toUpperCase())) {
      return this.getRegisterValue(arg);
    }
    const parsed = parseInt(arg, 10);
    return isNaN(parsed) ? 0 : parsed;
  }

  private resolveJumpAddress(inst: Instruction): number {
    const target = (inst as any).targetLabel || inst.label;
    if (target) {
      // Find the instruction whose label matches target (excluding the jump instruction itself)
      const idx = this.instructions.findIndex(
        (i) => i.label === target && !['JMP', 'JZ', 'JNZ', 'JG', 'JL', 'CALL'].includes(i.op)
      );
      if (idx !== -1) return 0x0080 + idx;
      const anyIdx = this.instructions.findIndex((i) => i.label === target);
      if (anyIdx !== -1) return 0x0080 + anyIdx;
    }
    if (inst.addr !== undefined) {
      if (inst.addr < 0x0080 && inst.addr < this.instructions.length) {
        return 0x0080 + inst.addr;
      }
      return inst.addr;
    }
    if (inst.val !== undefined) {
      if (inst.val < 0x0080 && inst.val < this.instructions.length) {
        return 0x0080 + inst.val;
      }
      return inst.val;
    }
    const resolved = this.resolveValue(inst.src);
    if (resolved < 0x0080 && resolved < this.instructions.length) {
      return 0x0080 + resolved;
    }
    return resolved;
  }

  private packFlags(): number {
    let f = 0;
    if (this.flags.zero) f |= 1;
    if (this.flags.sign) f |= 2;
    if (this.flags.carry) f |= 4;
    if (this.flags.overflow) f |= 8;
    if (this.flags.interrupts) f |= 16;
    return f;
  }

  private unpackFlags(f: number): void {
    this.flags.zero = (f & 1) !== 0;
    this.flags.sign = (f & 2) !== 0;
    this.flags.carry = (f & 4) !== 0;
    this.flags.overflow = (f & 8) !== 0;
    this.flags.interrupts = (f & 16) !== 0;
  }

  public getSnapshot(): VirtualComputerState {
    return {
      registers: { ...this.registers },
      flags: { ...this.flags },
      cyclePhase: this.cyclePhase,
      alu: { ...this.alu },
      clockSpeedHz: this.clockSpeedHz,
      isRunning: this.isRunning,
      cycleCount: this.cycleCount,
      instructionsCount: this.instructionsCount,
      lastError: this.lastError,
    };
  }
}
