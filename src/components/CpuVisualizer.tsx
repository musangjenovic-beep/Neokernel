import React from 'react';
import {
  AluState,
  CpuFlags,
  CpuRegisters,
  MachineCyclePhase,
} from '../types/virtualComputer';
import { Cpu, Zap, Activity, ArrowRight, ShieldCheck, Clock } from 'lucide-react';

interface CpuVisualizerProps {
  registers: CpuRegisters;
  flags: CpuFlags;
  alu: AluState;
  cyclePhase: MachineCyclePhase;
  isRunning: boolean;
  cycleCount: number;
  instructionsCount: number;
  onStepMicroCycle: () => void;
  irq0: boolean;
  irq1: boolean;
  irq2: boolean;
  lastError: string | null;
}

export const CpuVisualizer: React.FC<CpuVisualizerProps> = ({
  registers,
  flags,
  alu,
  cyclePhase,
  isRunning,
  cycleCount,
  instructionsCount,
  onStepMicroCycle,
  irq0,
  irq1,
  irq2,
  lastError,
}) => {
  const phases: { id: MachineCyclePhase; label: string; desc: string }[] = [
    { id: 'FETCH', label: 'FETCH', desc: 'Lecture instruction' },
    { id: 'DECODE', label: 'DECODE', desc: 'Décodage opcode' },
    { id: 'EXECUTE', label: 'EXECUTE', desc: 'Calcul ALU / Saut' },
    { id: 'WRITEBACK', label: 'WRITEBACK', desc: 'Écriture registre/RAM' },
    { id: 'INTERRUPT_CHECK', label: 'IRQ CHECK', desc: 'Test interruptions' },
  ];

  const formatHex = (num: number, padding: number = 4) => {
    const unsigned = (num >>> 0) & (padding === 4 ? 0xffff : 0xff);
    return '0x' + unsigned.toString(16).toUpperCase().padStart(padding, '0');
  };

  return (
    <div className="space-y-4">
      {/* Top Banner: Cycle Phase Pipeline & Micro-Stepping */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-slate-200">
              Unité de Contrôle & Cycle Machine (Pipeline)
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
            <span>Cycles: <strong className="text-slate-100 tabular-nums">{cycleCount}</strong></span>
            <span>·</span>
            <span>Instructions: <strong className="text-cyan-400 tabular-nums">{instructionsCount}</strong></span>
            <button
              onClick={onStepMicroCycle}
              disabled={isRunning || cyclePhase === 'HALTED'}
              className="px-2.5 py-1 text-[11px] font-sans font-medium bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded border border-slate-700 transition-colors"
            >
              Micro-Pas Horloge
            </button>
          </div>
        </div>

        {/* 5-Phase Machine Pipeline Indicator */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {phases.map((p, idx) => {
            const isActive = cyclePhase === p.id;
            return (
              <div
                key={p.id}
                className={`p-2.5 rounded-lg border text-center transition-all ${
                  isActive
                    ? 'bg-cyan-500/10 border-cyan-500 text-cyan-300 ring-1 ring-cyan-500/30'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}
              >
                <div className="text-[10px] font-mono tracking-wider font-semibold">
                  {idx + 1}. {p.label}
                </div>
                <div className="text-[11px] truncate mt-0.5 text-slate-300 font-sans">
                  {p.desc}
                </div>
              </div>
            );
          })}
        </div>

        {lastError && (
          <div className="mt-3 p-2 bg-rose-500/10 border border-rose-500/30 rounded text-rose-300 text-xs">
            {lastError}
          </div>
        )}
      </div>

      {/* Grid: Registers & ALU */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left Column (7 cols): Registers */}
        <div className="md:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Banc de Registres Matériels (16-bit)
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              IR: <span className="text-cyan-300 font-semibold">{registers.IR || 'NOP'}</span>
            </span>
          </div>

          {/* Program Counter & Stack Pointer */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5">
              <div className="flex justify-between items-center text-[11px] text-slate-400">
                <span className="font-semibold text-cyan-400">PC (Program Counter)</span>
                <span className="font-mono text-slate-300">{formatHex(registers.PC)}</span>
              </div>
              <div className="text-xs font-mono font-medium text-slate-100 mt-1">
                Adresse 0x{registers.PC.toString(16).toUpperCase()} ({registers.PC})
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Pointeur de l'instruction en cours</div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5">
              <div className="flex justify-between items-center text-[11px] text-slate-400">
                <span className="font-semibold text-rose-400">SP (Stack Pointer)</span>
                <span className="font-mono text-slate-300">{formatHex(registers.SP)}</span>
              </div>
              <div className="text-xs font-mono font-medium text-slate-100 mt-1">
                Adresse 0x{registers.SP.toString(16).toUpperCase()} ({registers.SP})
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Sommet de la pile (Stack)</div>
            </div>
          </div>

          {/* General Purpose Registers R0 - R3 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            {(['R0', 'R1', 'R2', 'R3'] as const).map((rName) => {
              const val = registers[rName];
              return (
                <div key={rName} className="bg-slate-950/70 border border-slate-800 rounded-lg p-2">
                  <div className="text-[11px] font-mono font-semibold text-slate-300 flex justify-between">
                    <span>{rName}</span>
                    <span className="text-slate-400 font-normal">{formatHex(val)}</span>
                  </div>
                  <div className="text-sm font-mono font-bold text-slate-100 mt-0.5 tabular-nums">
                    {val}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Arithmetic & Index Registers: A, B, IX */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2">
              <div className="text-[11px] font-mono font-semibold text-indigo-400 flex justify-between">
                <span>A (Accum.)</span>
                <span className="text-slate-400 font-normal">{formatHex(registers.A)}</span>
              </div>
              <div className="text-sm font-mono font-bold text-slate-100 mt-0.5 tabular-nums">
                {registers.A}
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2">
              <div className="text-[11px] font-mono font-semibold text-indigo-400 flex justify-between">
                <span>B (Math)</span>
                <span className="text-slate-400 font-normal">{formatHex(registers.B)}</span>
              </div>
              <div className="text-sm font-mono font-bold text-slate-100 mt-0.5 tabular-nums">
                {registers.B}
              </div>
            </div>

            <div className="bg-slate-950/70 border border-amber-500/20 rounded-lg p-2 bg-amber-500/5">
              <div className="text-[11px] font-mono font-semibold text-amber-400 flex justify-between">
                <span>IX (Index DBD)</span>
                <span className="text-slate-400 font-normal">{formatHex(registers.IX)}</span>
              </div>
              <div className="text-sm font-mono font-bold text-amber-200 mt-0.5 tabular-nums">
                {registers.IX}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): ALU & Flags */}
        <div className="md:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                Unité Arithmétique & Logique (ALU)
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                  alu.active
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {alu.active ? alu.operation : 'IDLE'}
              </span>
            </div>

            {/* ALU Visual Box */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-1.5 bg-slate-900 rounded border border-slate-800">
                  <div className="text-[10px] text-slate-400">Opérande A</div>
                  <div className="font-semibold text-slate-200 tabular-nums">{alu.operandA}</div>
                </div>
                <div className="p-1.5 bg-slate-900 rounded border border-slate-800">
                  <div className="text-[10px] text-slate-400">Opérande B</div>
                  <div className="font-semibold text-slate-200 tabular-nums">{alu.operandB}</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-xs font-mono">
                <div className="flex items-center gap-1 text-slate-400">
                  <span>Opération:</span>
                  <span className="text-cyan-400 font-semibold">{alu.operation}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span className="font-bold text-emerald-400 tabular-nums">
                    {alu.result} ({formatHex(alu.result)})
                  </span>
                </div>
              </div>
            </div>

            {/* Status Flags Register */}
            <div className="mt-3">
              <div className="text-[11px] text-slate-400 mb-1.5 font-medium">
                Registre des Drapeaux (FLAGS / PSW)
              </div>
              <div className="grid grid-cols-5 gap-1.5 text-center font-mono text-xs">
                <div
                  className={`p-1.5 rounded border transition-colors ${
                    flags.zero
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-slate-950/60 border-slate-800 text-slate-500'
                  }`}
                  title="Zero Flag (Z)"
                >
                  <div>Z</div>
                  <div className="text-[10px]">{flags.zero ? '1' : '0'}</div>
                </div>

                <div
                  className={`p-1.5 rounded border transition-colors ${
                    flags.sign
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                      : 'bg-slate-950/60 border-slate-800 text-slate-500'
                  }`}
                  title="Sign / Negative Flag (S)"
                >
                  <div>S</div>
                  <div className="text-[10px]">{flags.sign ? '1' : '0'}</div>
                </div>

                <div
                  className={`p-1.5 rounded border transition-colors ${
                    flags.carry
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                      : 'bg-slate-950/60 border-slate-800 text-slate-500'
                  }`}
                  title="Carry Flag (C)"
                >
                  <div>C</div>
                  <div className="text-[10px]">{flags.carry ? '1' : '0'}</div>
                </div>

                <div
                  className={`p-1.5 rounded border transition-colors ${
                    flags.overflow
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold'
                      : 'bg-slate-950/60 border-slate-800 text-slate-500'
                  }`}
                  title="Overflow Flag (O)"
                >
                  <div>O</div>
                  <div className="text-[10px]">{flags.overflow ? '1' : '0'}</div>
                </div>

                <div
                  className={`p-1.5 rounded border transition-colors ${
                    flags.interrupts
                      ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 font-bold'
                      : 'bg-slate-950/60 border-slate-800 text-slate-500'
                  }`}
                  title="Interrupt Enable Flag (I)"
                >
                  <div>I</div>
                  <div className="text-[10px]">{flags.interrupts ? '1' : '0'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Interrupt Lines IRQ0 / IRQ1 / IRQ2 Status */}
          <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              Lignes d'Interruption (IRQ):
            </span>
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className={irq0 ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                IRQ0:{irq0 ? 'ACTIF' : '0'}
              </span>
              <span>·</span>
              <span className={irq1 ? 'text-cyan-400 font-bold' : 'text-slate-500'}>
                IRQ1:{irq1 ? 'ACTIF' : '0'}
              </span>
              <span>·</span>
              <span className={irq2 ? 'text-indigo-400 font-bold' : 'text-slate-500'}>
                IRQ2:{irq2 ? 'ACTIF' : '0'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
