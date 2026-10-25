/**
 * Types and interfaces for the VirtuArch Virtual Computer Architecture
 */

export type OpCode =
  | 'NOP'
  | 'HALT'
  | 'MOV'
  | 'LOAD'
  | 'STORE'
  | 'LOAD_IX'
  | 'STORE_IX'
  | 'PUSH'
  | 'POP'
  | 'ADD'
  | 'SUB'
  | 'MUL'
  | 'DIV'
  | 'MOD'
  | 'INC'
  | 'DEC'
  | 'AND'
  | 'OR'
  | 'XOR'
  | 'NOT'
  | 'SHL'
  | 'SHR'
  | 'CMP'
  | 'JMP'
  | 'JZ'
  | 'JNZ'
  | 'JG'
  | 'JL'
  | 'CALL'
  | 'RET'
  | 'INT'
  | 'RTI'
  | 'CLI'
  | 'STI'
  | 'IN'
  | 'OUT'
  | 'DRAW_PIXEL'
  | 'CLEAR_SCREEN'
  | 'DRAW_CHAR'
  | 'DRAW_TEXT'
  | 'DBD_SET'
  | 'DBD_GET'
  | 'DISK_READ'
  | 'DISK_WRITE';

export type CpuRegisterName = 'PC' | 'SP' | 'R0' | 'R1' | 'R2' | 'R3' | 'A' | 'B' | 'IX' | 'IR';

export interface CpuFlags {
  zero: boolean;      // Z: Result was 0
  sign: boolean;      // S / N: Result was negative
  carry: boolean;     // C: Arithmetic carry
  overflow: boolean;  // O: Signed overflow
  interrupts: boolean;// I: Hardware interrupts enabled
}

export interface CpuRegisters {
  PC: number;  // Program Counter
  SP: number;  // Stack Pointer
  R0: number;  // General Purpose 0
  R1: number;  // General Purpose 1
  R2: number;  // General Purpose 2
  R3: number;  // General Purpose 3
  A: number;   // Accumulator
  B: number;   // Secondary math register
  IX: number;  // Index Register (for array/table indexing)
  IR: string;  // Current Instruction Register (mnemonic display)
}

export type MachineCyclePhase = 'FETCH' | 'DECODE' | 'EXECUTE' | 'WRITEBACK' | 'INTERRUPT_CHECK' | 'HALTED';

export interface AluState {
  operation: string;
  operandA: number;
  operandB: number;
  result: number;
  active: boolean;
}

export interface Instruction {
  op: OpCode;
  dst?: string | number; // Register name or target
  src?: string | number; // Register name or immediate value
  addr?: number;         // Memory address
  val?: number;          // Immediate numeric value
  vector?: number;       // Interrupt vector (0..7)
  port?: number;         // I/O Port number (0..7)
  label?: string;        // Optional label for jumps
  comment?: string;      // Educational explanation
  text?: string;         // String literal for DRAW_TEXT
}

export interface InterruptVector {
  vector: number;
  name: string;
  handlerAddr: number;
  description: string;
}

export interface DbdEntry {
  index: number;
  ramAddress: number;
  key: number;
  recordPointer: number;
  leftChild: number;   // -1 if none
  rightChild: number;  // -1 if none
  flags: number;       // 1 = active, 0 = deleted
}

export interface DbdIndexStats {
  rootIndex: number;
  count: number;
  capacity: number;
  lookupsCount: number;
  lastLookupKey: number | null;
  lastLookupSteps: number;
  lastFound: boolean;
  baseAddress: number;
}

export interface DiskSector {
  sectorId: number;
  data: number[]; // 64 words per sector
}

export interface MemorySegment {
  name: string;
  start: number;
  end: number;
  color: string;
  description: string;
}

export interface VirtualComputerState {
  registers: CpuRegisters;
  flags: CpuFlags;
  cyclePhase: MachineCyclePhase;
  alu: AluState;
  clockSpeedHz: number; // 0 = max/unlimited, 1, 5, 20, 100
  isRunning: boolean;
  cycleCount: number;
  instructionsCount: number;
  lastError: string | null;
}
