import React from 'react';
import { Cpu, Radio, Shield, HelpCircle } from 'lucide-react';

interface IoPortsPanelProps {
  ioPorts: number[];
  timerInterval: number;
  timerCounter: number;
  timerEnabled: boolean;
  onToggleTimer: () => void;
  onSetTimerInterval: (interval: number) => void;
  ivtAddresses: { vector: number; name: string; addr: number; irqName: string }[];
}

export const IoPortsPanel: React.FC<IoPortsPanelProps> = ({
  ioPorts,
  timerInterval,
  timerCounter,
  timerEnabled,
  onToggleTimer,
  onSetTimerInterval,
  ivtAddresses,
}) => {
  const PORTS_METADATA = [
    { port: 0, name: 'PORT 0', label: 'Coordonnée Écran X', desc: 'Registre X pour pixel (0..31)' },
    { port: 1, name: 'PORT 1', label: 'Coordonnée Écran Y', desc: 'Registre Y pour pixel (0..31)' },
    { port: 2, name: 'PORT 2', label: 'Couleur Pixel VRAM', desc: 'Indice palette 0..15 (déclenche écriture VRAM)' },
    { port: 3, name: 'PORT 3', label: 'Commande Écran', desc: '0=Normal, 1=Effacer écran' },
    { port: 4, name: 'PORT 4', label: 'Tampon Clavier ASCII', desc: 'Code ASCII de la touche frappée' },
    { port: 5, name: 'PORT 5', label: 'Intervalle Timer', desc: 'Période en cycles CPU avant IRQ0' },
    { port: 6, name: 'PORT 6', label: 'Sélecteur Secteur Disque', desc: 'Numéro de secteur de 0 à 7' },
    { port: 7, name: 'PORT 7', label: 'Statut E/S Général', desc: 'Registre d\'état des bus périphériques' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
      {/* Left Column (7 cols): Hardware I/O Ports */}
      <div className="md:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-slate-200">
              Registres des Ports d'Entrée / Sortie (Bus I/O)
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Instructions: <code className="text-cyan-300">IN</code> / <code className="text-cyan-300">OUT</code>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
          {PORTS_METADATA.map((p) => {
            const val = ioPorts[p.port] || 0;
            return (
              <div
                key={p.port}
                className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-slate-300">
                    <span className="text-cyan-400">{p.name}</span>
                    <span className="text-slate-500 font-normal">·</span>
                    <span className="text-[11px] font-sans font-medium text-slate-300 truncate max-w-[130px]">
                      {p.label}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-sans mt-0.5 truncate">
                    {p.desc}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold text-white tabular-nums">
                    {val}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    0x{val.toString(16).toUpperCase()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column (5 cols): Interrupt Vector Table (IVT) & Hardware Timer */}
      <div className="md:col-span-5 space-y-4">
        {/* IVT Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              Table des Vecteurs d'Interruption (IVT en RAM)
            </span>
          </div>

          <div className="space-y-1.5 font-mono text-xs">
            {ivtAddresses.map((ivt) => (
              <div
                key={ivt.vector}
                className="p-2 bg-slate-950/70 border border-slate-800 rounded flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-slate-300 text-[11px]">
                    Vecteur #{ivt.vector} : <span className="text-indigo-400">{ivt.irqName}</span>
                  </div>
                  <div className="text-[10px] font-sans text-slate-400">{ivt.name}</div>
                </div>

                <div className="text-right text-[11px]">
                  <div className="text-cyan-400 font-bold">
                    0x{ivt.addr.toString(16).toUpperCase().padStart(4, '0')}
                  </div>
                  <div className="text-[10px] text-slate-500 font-sans">
                    {ivt.addr === 0 ? 'Non configuré' : `Ligne ${ivt.addr - 0x0080}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hardware Timer Configuration Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs font-mono">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-slate-200 text-[11px]">Horloge Timer Matériel (IRQ0)</span>
            <button
              onClick={onToggleTimer}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                timerEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                  : 'bg-slate-950 text-slate-500 border-slate-800'
              }`}
            >
              {timerEnabled ? 'ACTIF' : 'DÉSACTIVÉ'}
            </button>
          </div>

          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-2">
            <span>Compteur de cycles:</span>
            <span className="text-white font-bold tabular-nums">
              {timerCounter} / {timerInterval} cycles
            </span>
          </div>

          <div className="flex items-center gap-1.5 pt-1">
            <span className="text-slate-400 text-[10px]">Période:</span>
            {[20, 40, 80, 160].map((int) => (
              <button
                key={int}
                onClick={() => onSetTimerInterval(int)}
                className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                  timerInterval === int
                    ? 'bg-indigo-500 text-white font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {int}c
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
