import React from 'react';
import { Cpu, Play, Pause, RotateCcw, Sliders, FastForward } from 'lucide-react';

interface HeaderProps {
  isRunning: boolean;
  onToggleRun: () => void;
  onStepInstruction: () => void;
  onReset: () => void;
  onOpenSettings: () => void;
  clockSpeedHz: number;
  setClockSpeedHz: (speed: number) => void;
  currentOsName: string;
}

export const Header: React.FC<HeaderProps> = ({
  isRunning,
  onToggleRun,
  onStepInstruction,
  onReset,
  onOpenSettings,
  clockSpeedHz,
  setClockSpeedHz,
  currentOsName,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-900 border-b border-slate-800 text-slate-100">
      {/* Zone 1: Brand Wordmark (Single text element) */}
      <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
          <Cpu className="w-4 h-4" />
        </div>
        <span className="text-base font-semibold tracking-tight text-white">
          VirtuArch <span className="text-cyan-400 font-mono text-sm font-normal">Terminal</span>
        </span>
      </div>

      {/* Zone 2: Clean single-line status text */}
      <div className="hidden md:flex items-center gap-4 text-xs font-mono text-slate-400 whitespace-nowrap truncate">
        <span>OS: <strong className="text-cyan-300 font-sans font-medium">{currentOsName}</strong></span>
        <span>·</span>
        <span>État: <strong className={isRunning ? 'text-emerald-400' : 'text-amber-400'}>{isRunning ? 'EN EXÉCUTION' : 'EN PAUSE'}</strong></span>
        <span>·</span>
        <div className="flex items-center gap-1">
          <span className="text-slate-500 font-sans">Vitesse:</span>
          {[5, 20, 100].map((speed) => (
            <button
              key={speed}
              onClick={() => setClockSpeedHz(speed)}
              className={`px-1.5 py-0.5 rounded text-[10px] ${
                clockSpeedHz === speed
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {speed}Hz
            </button>
          ))}
        </div>
      </div>

      {/* Zone 3: Primary Action & Settings button */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onStepInstruction}
          disabled={isRunning}
          title="Exécuter une seule instruction (Pas à pas)"
          className="p-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg border border-slate-700 transition-colors whitespace-nowrap shrink-0"
        >
          <FastForward className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onReset}
          title="Réinitialiser l'ordinateur virtuel"
          className="p-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors whitespace-nowrap shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onToggleRun}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            isRunning
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold'
              : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Exécuter</span>
            </>
          )}
        </button>

        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg border border-slate-700 transition-colors whitespace-nowrap shrink-0"
        >
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span>Réglages</span>
        </button>
      </div>
    </header>
  );
};
