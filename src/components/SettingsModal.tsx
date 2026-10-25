import React, { useState } from 'react';
import { CpuVisualizer } from './CpuVisualizer';
import { DbdIndexVisualizer } from './DbdIndexVisualizer';
import { MemoryViewer } from './MemoryViewer';
import { InstructionEditor } from './InstructionEditor';
import { DiskManager } from './DiskManager';
import { IoPortsPanel } from './IoPortsPanel';
import { VirtualComputer } from '../core/cpu';
import { OsPreset } from '../core/osPrograms';
import { Instruction } from '../types/virtualComputer';
import {
  X,
  FileCode,
  Database,
  Cpu,
  HardDrive,
  Radio,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  computer: VirtualComputer;
  isRunning: boolean;
  onStepMicroCycle: () => void;
  onLoadProgram: (instructions: Instruction[], baseAddr?: number) => void;
  onApplyPreset: (preset: OsPreset) => void;
  onWriteCell: (address: number, val: number) => void;
  onFormatDisk: () => void;
  onReadSectorToRam: (sector: number, ramAddr: number) => void;
  onWriteRamToSector: (sector: number, ramAddr: number) => void;
  onToggleTimer: () => void;
  onSetTimerInterval: (interval: number) => void;
  ivtAddresses: { vector: number; name: string; addr: number; irqName: string }[];
  onRefresh: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  computer,
  isRunning,
  onStepMicroCycle,
  onLoadProgram,
  onApplyPreset,
  onWriteCell,
  onFormatDisk,
  onReadSectorToRam,
  onWriteRamToSector,
  onToggleTimer,
  onSetTimerInterval,
  ivtAddresses,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'code' | 'dbd' | 'cpu' | 'memory' | 'disk' | 'io'>('code');

  if (!isOpen) return null;

  const TABS = [
    { id: 'code', label: 'Injecteur JSON / OS', icon: FileCode },
    { id: 'dbd', label: 'Index DBD (RAM)', icon: Database },
    { id: 'cpu', label: 'CPU & Registres', icon: Cpu },
    { id: 'memory', label: 'Mémoire RAM (Hex)', icon: HardDrive },
    { id: 'disk', label: 'Disque & Stockage', icon: HardDrive },
    { id: 'io', label: 'Ports E/S & Horloge', icon: Radio },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-6xl max-h-[92vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">
                Réglages & Architecture Matérielle
              </h2>
              <p className="text-[11px] text-slate-400">
                Configuration bas-niveau, injection de code JSON, index DBD en RAM et périphériques
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 py-2 border-b border-slate-800/80 bg-slate-950/50 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-slate-800 text-cyan-300 border border-slate-700 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body Container with Custom Scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Tab 1: Code / JSON / OS */}
          {activeTab === 'code' && (
            <div className="space-y-4">
              <InstructionEditor
                currentInstructions={computer.instructions}
                onLoadProgram={onLoadProgram}
                currentPC={computer.registers.PC}
                isRunning={isRunning}
                onApplyPreset={onApplyPreset}
              />
            </div>
          )}

          {/* Tab 2: DBD Memory Index */}
          {activeTab === 'dbd' && (
            <DbdIndexVisualizer memory={computer.memory} onRefresh={onRefresh} />
          )}

          {/* Tab 3: CPU & Registers & ALU */}
          {activeTab === 'cpu' && (
            <CpuVisualizer
              registers={computer.registers}
              flags={computer.flags}
              alu={computer.alu}
              cyclePhase={computer.cyclePhase}
              isRunning={isRunning}
              cycleCount={computer.cycleCount}
              instructionsCount={computer.instructionsCount}
              onStepMicroCycle={onStepMicroCycle}
              irq0={computer.irq0Pending}
              irq1={computer.irq1Pending}
              irq2={computer.irq2Pending}
              lastError={computer.lastError}
            />
          )}

          {/* Tab 4: Memory RAM Viewer */}
          {activeTab === 'memory' && (
            <MemoryViewer
              memory={computer.memory}
              currentPC={computer.registers.PC}
              currentSP={computer.registers.SP}
              onWriteCell={onWriteCell}
            />
          )}

          {/* Tab 5: Storage & Disk */}
          {activeTab === 'disk' && (
            <DiskManager
              disk={computer.disk}
              onFormatDisk={onFormatDisk}
              onReadSectorToRam={onReadSectorToRam}
              onWriteRamToSector={onWriteRamToSector}
              irq2Pending={computer.irq2Pending}
            />
          )}

          {/* Tab 6: I/O Ports & Hardware Timer */}
          {activeTab === 'io' && (
            <IoPortsPanel
              ioPorts={computer.ioPorts}
              timerInterval={computer.timerInterval}
              timerCounter={computer.timerCounter}
              timerEnabled={computer.timerEnabled}
              onToggleTimer={onToggleTimer}
              onSetTimerInterval={onSetTimerInterval}
              ivtAddresses={ivtAddresses}
            />
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-900/90 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span>PC: <strong className="text-cyan-400 font-mono">0x{computer.registers.PC.toString(16).toUpperCase()}</strong></span>
            <span>·</span>
            <span>SP: <strong className="text-rose-400 font-mono">0x{computer.registers.SP.toString(16).toUpperCase()}</strong></span>
            <span>·</span>
            <span>Horloge: <strong className="text-slate-200 font-mono">{computer.clockSpeedHz} Hz</strong></span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 text-xs font-medium transition-colors"
          >
            Fermer et retourner au poste de travail
          </button>
        </div>
      </div>
    </div>
  );
};
