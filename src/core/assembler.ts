import { Instruction, OpCode } from '../types/virtualComputer';

/**
 * Assembler & JSON Disassembler for the Virtual Computer
 */

export class Assembler {
  /**
   * Convert structured JSON instructions to clean, human-readable assembly text
   */
  public static disassemble(instructions: Instruction[]): string {
    const lines: string[] = [];

    for (let i = 0; i < instructions.length; i++) {
      const inst = instructions[i];

      // Add label line if present
      if (inst.label) {
        lines.push(`${inst.label}:`);
      }

      let line = `  ${inst.op}`;

      switch (inst.op) {
        case 'NOP':
        case 'HALT':
        case 'RET':
        case 'RTI':
        case 'CLI':
        case 'STI':
          break;

        case 'MOV':
        case 'ADD':
        case 'SUB':
        case 'MUL':
        case 'DIV':
        case 'MOD':
        case 'AND':
        case 'OR':
        case 'XOR':
        case 'CMP':
        case 'SHL':
        case 'SHR':
          line += ` ${inst.dst}, ${inst.src !== undefined ? inst.src : inst.val}`;
          break;

        case 'LOAD':
          line += ` ${inst.dst}, [${inst.addr !== undefined ? '0x' + inst.addr.toString(16).toUpperCase() : inst.src}]`;
          break;

        case 'STORE':
          line += ` [${inst.addr !== undefined ? '0x' + inst.addr.toString(16).toUpperCase() : inst.dst}], ${inst.src}`;
          break;

        case 'LOAD_IX':
          line += ` ${inst.dst}, [${inst.addr !== undefined ? '0x' + inst.addr.toString(16).toUpperCase() : '0x0'} + IX]`;
          break;

        case 'STORE_IX':
          line += ` [${inst.addr !== undefined ? '0x' + inst.addr.toString(16).toUpperCase() : '0x0'} + IX], ${inst.src}`;
          break;

        case 'PUSH':
        case 'POP':
        case 'INC':
        case 'DEC':
        case 'NOT':
          line += ` ${inst.dst || inst.src}`;
          break;

        case 'JMP':
        case 'JZ':
        case 'JNZ':
        case 'JG':
        case 'JL':
        case 'CALL':
          line += ` ${inst.label || (inst.addr !== undefined ? '0x' + inst.addr.toString(16).toUpperCase() : inst.val)}`;
          break;

        case 'INT':
          line += ` ${inst.vector !== undefined ? inst.vector : inst.val}`;
          break;

        case 'IN':
          line += ` ${inst.dst}, PORT${inst.port !== undefined ? inst.port : 0}`;
          break;

        case 'OUT':
          line += ` PORT${inst.port !== undefined ? inst.port : 0}, ${inst.src}`;
          break;

        case 'DRAW_PIXEL':
          line += ` ${inst.dst || 'R0'}, ${inst.src || 'R1'}, ${inst.val !== undefined ? inst.val : 'R2'}`;
          break;

        case 'DRAW_CHAR':
          line += ` '${inst.dst || 'A'}', ${inst.src !== undefined ? inst.src : 'R0'}, ${inst.addr !== undefined ? inst.addr : 'R1'}, ${inst.val !== undefined ? inst.val : '12'}`;
          break;

        case 'DRAW_TEXT':
          line += ` "${inst.text || inst.dst || 'HELLO'}", ${inst.src !== undefined ? inst.src : 2}, ${inst.addr !== undefined ? inst.addr : 2}, ${inst.val !== undefined ? inst.val : 12}`;
          break;

        case 'CLEAR_SCREEN':
          line += ` ${inst.val !== undefined ? inst.val : 0}`;
          break;

        case 'DBD_SET':
          line += ` KEY=${inst.dst || inst.val}, VAL_PTR=${inst.src || inst.addr}`;
          break;

        case 'DBD_GET':
          line += ` ${inst.dst || 'R0'}, KEY=${inst.src !== undefined ? inst.src : inst.val}`;
          break;

        case 'DISK_READ':
        case 'DISK_WRITE':
          line += ` SECTOR=${inst.port || inst.val || 0}, RAM=${inst.addr || 0}`;
          break;

        default:
          line += ` ${JSON.stringify(inst)}`;
      }

      if (inst.comment) {
        line = line.padEnd(32, ' ') + ` ; ${inst.comment}`;
      }

      lines.push(line);
    }

    return lines.join('\n');
  }

  /**
   * Parse assembly text into Instruction objects
   */
  public static assemble(asmText: string): { instructions: Instruction[]; errors: string[] } {
    const lines = asmText.split('\n');
    const instructions: Instruction[] = [];
    const errors: string[] = [];
    const labelsMap = new Map<string, number>();

    // Pass 1: Collect labels and clean instructions
    const rawTokens: { lineNum: number; label?: string; opStr: string; args: string[]; comment?: string }[] = [];

    for (let i = 0; i < lines.length; i++) {
      let rawLine = lines[i].trim();
      if (!rawLine) continue;

      let comment: string | undefined;
      const commentIdx = rawLine.indexOf(';');
      if (commentIdx !== -1) {
        comment = rawLine.substring(commentIdx + 1).trim();
        rawLine = rawLine.substring(0, commentIdx).trim();
      }

      if (!rawLine) continue;

      let label: string | undefined;
      const colonIdx = rawLine.indexOf(':');
      if (colonIdx !== -1) {
        label = rawLine.substring(0, colonIdx).trim();
        labelsMap.set(label, rawTokens.length); // points to instruction index
        rawLine = rawLine.substring(colonIdx + 1).trim();
      }

      if (!rawLine) {
        // Label only line
        continue;
      }

      // Split op and args
      const firstSpace = rawLine.indexOf(' ');
      let opStr = '';
      let argsStr = '';
      if (firstSpace === -1) {
        opStr = rawLine.toUpperCase();
      } else {
        opStr = rawLine.substring(0, firstSpace).toUpperCase();
        argsStr = rawLine.substring(firstSpace + 1).trim();
      }

      const args = argsStr ? argsStr.split(',').map((a) => a.trim()) : [];
      rawTokens.push({ lineNum: i + 1, label, opStr, args, comment });
    }

    // Pass 2: Build Instruction objects
    for (const item of rawTokens) {
      const op = item.opStr as OpCode;
      const args = item.args;
      const inst: Instruction = { op };
      if (item.label) inst.label = item.label;
      if (item.comment) inst.comment = item.comment;

      try {
        switch (op) {
          case 'NOP':
          case 'HALT':
          case 'RET':
          case 'RTI':
          case 'CLI':
          case 'STI':
            break;

          case 'MOV':
          case 'ADD':
          case 'SUB':
          case 'MUL':
          case 'DIV':
          case 'MOD':
          case 'AND':
          case 'OR':
          case 'XOR':
          case 'CMP':
          case 'SHL':
          case 'SHR':
            if (args.length < 2) throw new Error(`${op} requires 2 arguments: dst, src`);
            inst.dst = args[0].toUpperCase();
            inst.src = this.parseValueOrRegister(args[1], labelsMap);
            break;

          case 'LOAD':
            if (args.length < 2) throw new Error(`LOAD requires dst, [addr]`);
            inst.dst = args[0].toUpperCase();
            inst.addr = this.parseAddress(args[1]);
            break;

          case 'STORE':
            if (args.length < 2) throw new Error(`STORE requires [addr], src`);
            inst.addr = this.parseAddress(args[0]);
            inst.src = this.parseValueOrRegister(args[1], labelsMap);
            break;

          case 'LOAD_IX':
            if (args.length < 2) throw new Error(`LOAD_IX requires dst, [addr + IX]`);
            inst.dst = args[0].toUpperCase();
            inst.addr = this.parseAddress(args[1].replace('+ IX', '').replace('+IX', ''));
            break;

          case 'STORE_IX':
            if (args.length < 2) throw new Error(`STORE_IX requires [addr + IX], src`);
            inst.addr = this.parseAddress(args[0].replace('+ IX', '').replace('+IX', ''));
            inst.src = this.parseValueOrRegister(args[1], labelsMap);
            break;

          case 'PUSH':
          case 'POP':
          case 'INC':
          case 'DEC':
          case 'NOT':
            if (args.length < 1) throw new Error(`${op} requires 1 argument`);
            inst.dst = args[0].toUpperCase();
            break;

          case 'JMP':
          case 'JZ':
          case 'JNZ':
          case 'JG':
          case 'JL':
          case 'CALL':
            if (args.length < 1) throw new Error(`${op} requires target address or label`);
            const target = args[0];
            if (labelsMap.has(target)) {
              inst.addr = labelsMap.get(target);
              inst.label = target;
            } else {
              inst.addr = this.parseNumber(target);
            }
            break;

          case 'INT':
            inst.vector = this.parseNumber(args[0] || '0');
            break;

          case 'IN':
            inst.dst = args[0].toUpperCase();
            inst.port = this.parsePort(args[1] || '0');
            break;

          case 'OUT':
            inst.port = this.parsePort(args[0] || '0');
            inst.src = this.parseValueOrRegister(args[1] || '0', labelsMap);
            break;

          case 'DRAW_PIXEL':
            inst.dst = args[0]?.toUpperCase() || 'R0';
            inst.src = args[1]?.toUpperCase() || 'R1';
            inst.val = this.parseValueOrRegister(args[2] || 'R2', labelsMap) as number;
            break;

          case 'DRAW_CHAR':
            inst.dst = args[0]?.replace(/'/g, '').replace(/"/g, '') || 'A';
            inst.src = this.parseValueOrRegister(args[1] || 'R0', labelsMap);
            inst.addr = this.parseNumber(args[2] || '0');
            inst.val = this.parseNumber(args[3] || '12');
            break;

          case 'DRAW_TEXT':
            inst.text = args[0]?.replace(/"/g, '') || 'HELLO';
            inst.src = this.parseNumber(args[1] || '2');
            inst.addr = this.parseNumber(args[2] || '2');
            inst.val = this.parseNumber(args[3] || '12');
            break;

          case 'CLEAR_SCREEN':
            inst.val = this.parseNumber(args[0] || '0');
            break;

          case 'DBD_SET':
            // DBD_SET key, val_ptr
            inst.val = this.parseNumber(args[0]?.replace('KEY=', '') || '0');
            inst.addr = this.parseNumber(args[1]?.replace('VAL_PTR=', '') || '0');
            break;

          case 'DBD_GET':
            // DBD_GET dst, key
            inst.dst = args[0]?.toUpperCase() || 'R0';
            inst.val = this.parseNumber(args[1]?.replace('KEY=', '') || '0');
            break;

          case 'DISK_READ':
          case 'DISK_WRITE':
            inst.port = this.parseNumber(args[0]?.replace('SECTOR=', '') || '0');
            inst.addr = this.parseNumber(args[1]?.replace('RAM=', '') || '0');
            break;

          default:
            errors.push(`Ligne ${item.lineNum}: Instruction inconnue '${op}'`);
            continue;
        }

        instructions.push(inst);
      } catch (err: any) {
        errors.push(`Ligne ${item.lineNum}: ${err.message}`);
      }
    }

    return { instructions, errors };
  }

  private static parseAddress(str: string): number {
    const cleaned = str.replace('[', '').replace(']', '').trim();
    return this.parseNumber(cleaned);
  }

  private static parseNumber(str: string): number {
    if (!str) return 0;
    str = str.trim();
    if (str.startsWith('0x') || str.startsWith('0X')) {
      return parseInt(str.substring(2), 16) || 0;
    }
    return parseInt(str, 10) || 0;
  }

  private static parsePort(str: string): number {
    str = str.trim().toUpperCase().replace('PORT', '');
    return this.parseNumber(str);
  }

  private static parseValueOrRegister(str: string, labelsMap: Map<string, number>): string | number {
    str = str.trim();
    if (['R0', 'R1', 'R2', 'R3', 'A', 'B', 'IX', 'SP', 'PC'].includes(str.toUpperCase())) {
      return str.toUpperCase();
    }
    if (labelsMap.has(str)) {
      return labelsMap.get(str)!;
    }
    return this.parseNumber(str);
  }

  /**
   * Validate JSON instruction array format
   */
  public static validateJsonInstructions(jsonString: string): { instructions: Instruction[] | null; error: string | null } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed)) {
        return { instructions: null, error: 'Le fichier JSON doit contenir un tableau d\'instructions []' };
      }

      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i];
        if (!item || typeof item !== 'object' || !item.op) {
          return { instructions: null, error: `Instruction à l'index ${i} invalide : propriété "op" requise` };
        }
      }

      return { instructions: parsed as Instruction[], error: null };
    } catch (e: any) {
      return { instructions: null, error: `Erreur de syntaxe JSON : ${e.message}` };
    }
  }
}
