import React from 'react';
import { OrdinateurVirtuel } from '../hardware/computer';
import { Usb, Tv, Volume2, VolumeX, HardDrive, Zap, CheckCircle2, AlertCircle } from 'lucide-react';

interface PhysicalPeripheralsBarProps {
  computer: OrdinateurVirtuel;
  onRefresh: () => void;
}

export const PhysicalPeripheralsBar: React.FC<PhysicalPeripheralsBarProps> = ({ computer, onRefresh }) => {
  const hub = computer.hubUsb;

  const toggleUsb = (port: 1 | 2 | 3) => {
    hub.basculerPort(port);
    computer.audio.jouerSonClicSouris();
    computer.os.rafraichirBureau();
    onRefresh();
  };

  const toggleVga = () => {
    computer.vga.basculerCableVGA();
    computer.audio.jouerSonClicSouris();
    computer.os.rafraichirBureau();
    onRefresh();
  };

  return (
    <div className="w-full max-w-4xl bg-stone-900 border-2 border-stone-800 rounded-xl p-3 sm:p-4 text-xs font-mono shadow-lg">
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-stone-800 text-stone-300">
        <span className="font-bold flex items-center gap-2 text-stone-200">
          <Zap className="w-4 h-4 text-amber-400" />
          CONNECTIQUE PHYSIQUE & PORTS D'ENTREE / SORTIE (E/S DU PC)
        </span>
        <span className="text-[11px] text-stone-500">
          Signaux & Paquets 100% Binaires
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
        {/* Port USB 1 : Clavier */}
        <div className={`p-2.5 rounded-lg border transition-all ${
          computer.clavier.estBranche
            ? 'bg-stone-950 border-emerald-500/40 text-stone-200'
            : 'bg-stone-950/60 border-stone-800 text-stone-500'
        }`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1.5 font-bold text-emerald-400 text-[11px]">
              <Usb className="w-3.5 h-3.5" />
              PORT USB 1
            </span>
            <span className={`w-2 h-2 rounded-full ${computer.clavier.estBranche ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-rose-500'}`} />
          </div>
          <div className="text-[11px] text-stone-300 font-semibold truncate">
            Clavier Matériel
          </div>
          <div className="text-[10px] text-stone-400 mt-1 truncate">
            Trame : <span className="text-emerald-300">{computer.clavier.dernierPaquet?.octetBinaire || '0b00000000'}</span>
          </div>
          <button
            onClick={() => toggleUsb(1)}
            className="mt-2 w-full py-1 bg-stone-800 hover:bg-stone-700 rounded text-[10px] transition-colors"
          >
            {computer.clavier.estBranche ? 'Débrancher' : 'Rebrancher'}
          </button>
        </div>

        {/* Port USB 2 : Souris */}
        <div className={`p-2.5 rounded-lg border transition-all ${
          computer.souris.estBranche
            ? 'bg-stone-950 border-cyan-500/40 text-stone-200'
            : 'bg-stone-950/60 border-stone-800 text-stone-500'
        }`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1.5 font-bold text-cyan-400 text-[11px]">
              <Usb className="w-3.5 h-3.5" />
              PORT USB 2
            </span>
            <span className={`w-2 h-2 rounded-full ${computer.souris.estBranche ? 'bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]' : 'bg-rose-500'}`} />
          </div>
          <div className="text-[11px] text-stone-300 font-semibold truncate">
            Souris Optique
          </div>
          <div className="text-[10px] text-stone-400 mt-1 truncate">
            HID : <span className="text-cyan-300">{computer.souris.dernierPaquet?.octetBoutons || '0b00000000'}</span>
          </div>
          <button
            onClick={() => toggleUsb(2)}
            className="mt-2 w-full py-1 bg-stone-800 hover:bg-stone-700 rounded text-[10px] transition-colors"
          >
            {computer.souris.estBranche ? 'Débrancher' : 'Rebrancher'}
          </button>
        </div>

        {/* Port USB 3 : Clé Flash Storage */}
        <div className={`p-2.5 rounded-lg border transition-all ${
          hub.cleUsb.estBranchee
            ? 'bg-stone-950 border-amber-500/40 text-stone-200'
            : 'bg-stone-950/60 border-stone-800 text-stone-500'
        }`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1.5 font-bold text-amber-400 text-[11px]">
              <Usb className="w-3.5 h-3.5" />
              PORT USB 3
            </span>
            <span className={`w-2 h-2 rounded-full ${hub.cleUsb.estBranchee ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]' : 'bg-stone-700'}`} />
          </div>
          <div className="text-[11px] text-stone-300 font-semibold truncate">
            Clé Flash Drive
          </div>
          <div className="text-[10px] text-stone-400 mt-1 truncate">
            {hub.cleUsb.estBranchee ? '64 Ko · 2 fichiers .bin' : 'Port Libre'}
          </div>
          <button
            onClick={() => toggleUsb(3)}
            className="mt-2 w-full py-1 bg-stone-800 hover:bg-stone-700 rounded text-[10px] transition-colors"
          >
            {hub.cleUsb.estBranchee ? 'Éjecter Clé' : 'Insérer Clé'}
          </button>
        </div>

        {/* Port VGA : Vers le Moniteur */}
        <div className={`p-2.5 rounded-lg border transition-all ${
          computer.vga.estConnecte
            ? 'bg-stone-950 border-blue-500/40 text-stone-200'
            : 'bg-stone-950/60 border-rose-500/40 text-rose-300'
        }`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1.5 font-bold text-blue-400 text-[11px]">
              <Tv className="w-3.5 h-3.5" />
              PORT VGA
            </span>
            <span className={`w-2 h-2 rounded-full ${computer.vga.estConnecte ? 'bg-blue-400 shadow-[0_0_6px_rgba(59,130,246,0.8)]' : 'bg-rose-500'}`} />
          </div>
          <div className="text-[11px] text-stone-300 font-semibold truncate">
            Câble Vidéo VGA
          </div>
          <div className="text-[10px] text-stone-400 mt-1 truncate">
            330×165 · 60 Hz Binaire
          </div>
          <button
            onClick={toggleVga}
            className="mt-2 w-full py-1 bg-stone-800 hover:bg-stone-700 rounded text-[10px] transition-colors"
          >
            {computer.vga.estConnecte ? 'Débrancher VGA' : 'Brancher VGA'}
          </button>
        </div>

        {/* Sortie Audio Jack 3.5mm */}
        <div className="p-2.5 rounded-lg border bg-stone-950 border-purple-500/40 text-stone-200">
          <div className="flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1.5 font-bold text-purple-400 text-[11px]">
              <Volume2 className="w-3.5 h-3.5" />
              SORTIE AUDIO
            </span>
            <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.8)]" />
          </div>
          <div className="text-[11px] text-stone-300 font-semibold truncate">
            Jack 3.5mm Stéréo
          </div>
          <div className="text-[10px] text-stone-400 mt-1 truncate">
            Signal : <span className="text-purple-300">{computer.audio.derniereCommandeBinaire}</span>
          </div>
          <button
            onClick={() => {
              computer.audio.jouerBip(520, 0.12, 'square');
              onRefresh();
            }}
            className="mt-2 w-full py-1 bg-stone-800 hover:bg-stone-700 rounded text-[10px] transition-colors"
          >
            Tester Bip Audio
          </button>
        </div>
      </div>
    </div>
  );
};
