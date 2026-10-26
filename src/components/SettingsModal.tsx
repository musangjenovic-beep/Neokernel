import React, { useState } from 'react';
import { OrdinateurVirtuel } from '../hardware/computer';
import { VirtualComputer } from '../core/cpu';
import { OsPreset } from '../core/osPrograms';
import { Instruction } from '../types/virtualComputer';
import { PALETTE_BINAIRE, PhosphorTheme } from '../hardware/monitor';
import { CpuVisualizer } from './CpuVisualizer';
import { DbdIndexVisualizer } from './DbdIndexVisualizer';
import { MemoryViewer } from './MemoryViewer';
import { InstructionEditor } from './InstructionEditor';
import { DiskManager } from './DiskManager';
import { GuideManuelView } from './GuideManuelView';
import {
  X,
  FileCode,
  Database,
  Cpu,
  HardDrive,
  Sliders,
  Usb,
  Tv,
  Volume2,
  Palette,
  CheckCircle,
  Play,
  BookOpen,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ordinateur: OrdinateurVirtuel;
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
  initialTab?: 'ports' | 'os_code' | 'json_cpu' | 'cpu' | 'dbd' | 'memory' | 'disk' | 'guide';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  ordinateur,
  computer,
  isRunning,
  onStepMicroCycle,
  onLoadProgram,
  onApplyPreset,
  onWriteCell,
  onFormatDisk,
  onReadSectorToRam,
  onWriteRamToSector,
  onRefresh,
  initialTab = 'ports',
}) => {
  const [activeTab, setActiveTab] = useState<'ports' | 'os_code' | 'json_cpu' | 'cpu' | 'dbd' | 'memory' | 'disk' | 'guide'>(initialTab);
  const [editedOsCode, setEditedOsCode] = useState<string>(
    ordinateur.hubUsb.cleUsb.codeSource ||
      `// SYSTEME D'EXPLOITATION VIRTUARCH
CLEAR
RECT 20, 20, 290, 125
PRINT 40, 40, "SYSTEME PERSONNALISE ACTIF"
PRINT 40, 58, "MEMOIRE RAM CHARGEE DEPUIS CLE USB"
PRINT 40, 76, "PORTS 1, 2, 3 SUPPORTES"
LINE 40, 94, 280, 94
PRINT 40, 108, "VRAM 330x165 - TOUT EN BINAIRE"
BEEP 660
HALT`
  );
  const [osFeedback, setOsFeedback] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  const TABS = [
    { id: 'guide', label: 'Guide & Manuel Assembleur', icon: BookOpen },
    { id: 'ports', label: 'Branchements & Ports E/S', icon: Usb },
    { id: 'os_code', label: "Code Source de l'OS", icon: FileCode },
    { id: 'json_cpu', label: 'Injecteur JSON / CPU', icon: Sliders },
    { id: 'cpu', label: 'CPU & Registres', icon: Cpu },
    { id: 'dbd', label: 'Index DBD (RAM)', icon: Database },
    { id: 'memory', label: 'Mémoire RAM (Hex)', icon: HardDrive },
    { id: 'disk', label: 'Disque & Stockage', icon: HardDrive },
  ] as const;

  const handleApplyOsCode = () => {
    const port = ordinateur.hubUsb.cleUsb.port || 3;
    ordinateur.flasherEtBrancherCleUsb('OS_PERSONNALISE', editedOsCode, port);
    setOsFeedback(`Système flashé sur la Clé USB (Port ${port}) ! Cliquez sur Booter pour lancer.`);
    onRefresh();
    setTimeout(() => setOsFeedback(null), 3500);
  };

  const loadOsTemplate = (type: 'standard' | 'hello' | 'couleurs') => {
    let code = '';
    if (type === 'hello') {
      code = `// ==========================================
// PROGRAMME MINIMAL "HELLO WORLD"
// ==========================================
CLEAR
PRINT 60, 60, "HELLO WORLD !"
PRINT 60, 78, "100% BINAIRE - MONITEUR 330x165"
BEEP 880
HALT
`;
    } else if (type === 'couleurs') {
      code = `// ==========================================
// DEMONSTRATION PALETTE COULEURS
// ==========================================
CLEAR
PRINT 20, 20, "TEST GRAPHIQUE 16 COULEURS"
RECT 20, 35, 290, 60
LINE 20, 110, 310, 110
BEEP 440
HALT
`;
    } else {
      code = `// ==========================================
// SYSTEME D'EXPLOITATION GRAPHIQUE
// ==========================================
CLEAR
RECT 10, 10, 310, 145
PRINT 30, 30, "SYSTEME D'EXPLOITATION VIRTUEL"
PRINT 30, 50, "INITIALISE DEPUIS LA CLE USB"
LINE 30, 70, 290, 70
PRINT 30, 85, "PILOTES USB 1, 2, 3 CHARGES"
BEEP 520
HALT
`;
    }
    setEditedOsCode(code);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-6xl max-h-[92vh] bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-900/95">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">
                Réglages Matériels & Système B-OS
              </h2>
              <p className="text-[11px] text-stone-400">
                Menu central : branchement des ports physiques, code de l'OS, couleurs et processeur
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 border border-transparent hover:border-stone-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 py-2 border-b border-stone-800/80 bg-stone-950/60 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-950/40">
          {/* TAB 0: GUIDE & MANUEL ASSEMBLEUR */}
          {activeTab === 'guide' && (
            <GuideManuelView
              ordinateur={ordinateur}
              onLoadProgram={onLoadProgram}
              onRefresh={onRefresh}
            />
          )}

          {/* TAB 1: BRANCHEMENTS & PORTS */}
          {activeTab === 'ports' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Port USB 1 : Clavier */}
                <div className="p-4 bg-stone-900 border border-stone-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-stone-100 font-bold text-xs">
                      <Usb className="w-4 h-4 text-emerald-400" />
                      <span>PORT USB 1 : CLAVIER VIRTUEL</span>
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded font-mono ${ordinateur.clavier.estBranche ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'}`}>
                      {ordinateur.clavier.estBranche ? 'CONNECTE' : 'DEBRANCHE'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400">
                    Transmet les codes scancodes 8-bits en binaire dès qu'une touche est frappée.
                  </p>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] font-mono text-stone-400">
                      Dernier octet : <strong className="text-emerald-300">{ordinateur.clavier.dernierPaquet?.octetBinaire || '0b00000000'}</strong>
                    </span>
                    <button
                      onClick={() => {
                        if (ordinateur.clavier.estBranche) ordinateur.clavier.debrancher();
                        else ordinateur.clavier.brancher();
                        ordinateur.os.rafraichirBureau();
                        onRefresh();
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        ordinateur.clavier.estBranche
                          ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-stone-950'
                      }`}
                    >
                      {ordinateur.clavier.estBranche ? 'Débrancher le Clavier' : 'Brancher le Clavier'}
                    </button>
                  </div>
                </div>

                {/* Port USB 2 : Souris */}
                <div className="p-4 bg-stone-900 border border-stone-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-stone-100 font-bold text-xs">
                      <Usb className="w-4 h-4 text-cyan-400" />
                      <span>PORT USB 2 : SOURIS OPTIQUE</span>
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded font-mono ${ordinateur.souris.estBranche ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'}`}>
                      {ordinateur.souris.estBranche ? 'CONNECTEE' : 'DEBRANCHEE'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400">
                    Émet des paquets HID de 3 octets binaires [Status, DeltaX, DeltaY] et gère les clics.
                  </p>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] font-mono text-stone-400">
                      Position : <strong className="text-cyan-300">X:{ordinateur.souris.x} Y:{ordinateur.souris.y}</strong>
                    </span>
                    <button
                      onClick={() => {
                        if (ordinateur.souris.estBranche) ordinateur.souris.debrancher();
                        else ordinateur.souris.brancher();
                        ordinateur.os.rafraichirBureau();
                        onRefresh();
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        ordinateur.souris.estBranche
                          ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30'
                          : 'bg-cyan-500 hover:bg-cyan-400 text-stone-950'
                      }`}
                    >
                      {ordinateur.souris.estBranche ? 'Débrancher la Souris' : 'Brancher la Souris'}
                    </button>
                  </div>
                </div>

                {/* Port USB : Clé Flash & Bootloader */}
                <div className="p-4 bg-stone-900 border border-stone-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-stone-100 font-bold text-xs">
                      <Usb className="w-4 h-4 text-amber-400" />
                      <span>CLÉ USB FLASH (BOOT SUR PORT 1, 2 OU 3)</span>
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded font-mono ${ordinateur.hubUsb.cleUsb.estBranchee ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-stone-800 text-stone-400'}`}>
                      {ordinateur.hubUsb.cleUsb.estBranchee
                        ? `PORT USB ${ordinateur.hubUsb.cleUsb.port} · ${ordinateur.hubUsb.cleUsb.estBootable ? 'BOOTABLE' : 'VIERGE'}`
                        : 'EJECTEE / ABSENTE'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400">
                    Contient votre code binaire personnalisé compilé. Peut être branchée sur le Port 1, 2 ou 3 pour booter.
                  </p>
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-stone-400">
                      <span>Système : <strong className="text-amber-300">{ordinateur.hubUsb.cleUsb.nomSysteme || 'Aucun'}</strong></span>
                      <span>Taille : <strong className="text-emerald-300">{ordinateur.hubUsb.cleUsb.tailleOctets} octets</strong></span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] text-stone-400">Emplacement :</span>
                      {([1, 2, 3] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => {
                            ordinateur.hubUsb.brancherCleSurPort(p);
                            ordinateur.os.rafraichirBureau();
                            onRefresh();
                          }}
                          className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
                            ordinateur.hubUsb.cleUsb.estBranchee && ordinateur.hubUsb.cleUsb.port === p
                              ? 'bg-amber-500 text-stone-950 font-bold'
                              : 'bg-stone-950 border border-stone-800 text-stone-400 hover:text-white'
                          }`}
                        >
                          Port {p}
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          ordinateur.hubUsb.debrancherCle();
                          ordinateur.os.rafraichirBureau();
                          onRefresh();
                        }}
                        className="px-2 py-1 rounded text-xs font-mono bg-stone-950 border border-stone-800 text-stone-400 hover:text-rose-400 transition-colors"
                      >
                        Éjecter
                      </button>

                      {ordinateur.hubUsb.cleUsb.estBootable && ordinateur.hubUsb.cleUsb.estBranchee && (
                        <button
                          onClick={() => {
                            ordinateur.booterDepuisCle();
                            onClose();
                            onRefresh();
                          }}
                          className="ml-auto px-2.5 py-1 rounded text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-stone-950 transition-colors flex items-center gap-1"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Booter</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Câble Vidéo VGA & Audio */}
                <div className="p-4 bg-stone-900 border border-stone-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-stone-100 font-bold text-xs">
                      <Tv className="w-4 h-4 text-rose-400" />
                      <span>CÂBLE VGA & SORTIE AUDIO 3.5mm</span>
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded font-mono ${ordinateur.vga.estConnecte ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'}`}>
                      {ordinateur.vga.estConnecte ? 'VGA ACTIF' : 'VGA DEBRANCHE'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400">
                    Contrôle physique du flux vidéo VRAM vers l'écran CRT (330x165) et synthèse audio.
                  </p>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => {
                        ordinateur.vga.basculerCableVGA();
                        onRefresh();
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700"
                    >
                      {ordinateur.vga.estConnecte ? 'Débrancher VGA' : 'Brancher VGA'}
                    </button>
                    <button
                      onClick={() => {
                        ordinateur.audio.jouerBip(523, 0.2, 'square');
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 flex items-center gap-1"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Tester Son Jack</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Gestion de Couleur de l'écran en Binaire */}
              <div className="p-4 bg-stone-900 border border-stone-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-stone-100 font-bold text-xs">
                    <Palette className="w-4 h-4 text-emerald-400" />
                    <span>GESTION DES COULEURS DE L'ÉCRAN (TOUT EN BINAIRE)</span>
                  </div>
                  <span className="text-[10px] font-mono text-stone-400">
                    Résolution : 330×165 VRAM · Police 5×7
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-xs text-stone-300 font-medium">Mode d'affichage d'écran :</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          ordinateur.moniteur.modeCouleur = 'couleur_binaire';
                          ordinateur.moniteur.render();
                          onRefresh();
                        }}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                          ordinateur.moniteur.modeCouleur === 'couleur_binaire'
                            ? 'bg-emerald-500 text-stone-950 border-emerald-400 shadow'
                            : 'bg-stone-950 text-stone-300 border-stone-800 hover:border-stone-700'
                        }`}
                      >
                        Multicouleurs Binaire (16 nuances)
                      </button>
                      <button
                        onClick={() => {
                          ordinateur.moniteur.modeCouleur = 'monochrome';
                          ordinateur.moniteur.render();
                          onRefresh();
                        }}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                          ordinateur.moniteur.modeCouleur === 'monochrome'
                            ? 'bg-emerald-500 text-stone-950 border-emerald-400 shadow'
                            : 'bg-stone-950 text-stone-300 border-stone-800 hover:border-stone-700'
                        }`}
                      >
                        Phosphore Monochrome CRT
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-stone-300 font-medium">Teinte Phosphore (Mode Monochrome) :</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['green', 'amber', 'cyan', 'white'] as PhosphorTheme[]).map((thm) => (
                        <button
                          key={thm}
                          onClick={() => {
                            ordinateur.moniteur.theme = thm;
                            ordinateur.moniteur.render();
                            onRefresh();
                          }}
                          className={`py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                            ordinateur.moniteur.theme === thm
                              ? 'bg-stone-800 text-white border-stone-600'
                              : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200'
                          }`}
                        >
                          {thm === 'green' ? 'Vert' : thm === 'amber' ? 'Ambre' : thm === 'cyan' ? 'Cyan' : 'Blanc'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Échantillons de la palette binaire 16 couleurs */}
                <div className="pt-3 border-t border-stone-800/80">
                  <div className="text-[11px] font-mono text-stone-400 mb-2">Palette Binaire active (4-bits 0b0000 - 0b1111) :</div>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {Object.entries(PALETTE_BINAIRE).map(([k, col]) => (
                      <div key={k} className="p-1.5 rounded bg-stone-950 border border-stone-800 flex flex-col items-center gap-1">
                        <div
                          className="w-5 h-5 rounded border border-white/20"
                          style={{ backgroundColor: `rgb(${col.r}, ${col.g}, ${col.b})` }}
                        />
                        <span className="text-[9px] font-mono text-stone-300">{col.codeBinaire}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CODE SOURCE DE L'OS (B-OS) */}
          {activeTab === 'os_code' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-stone-200 uppercase tracking-wider">
                    Éditeur du Code Source de l'OS (B-OS)
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    Visualisez, modifiez et recompilez le code du système d'exploitation virtuel à la volée.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-400">Modèles préconfigurés :</span>
                  <button
                    onClick={() => loadOsTemplate('standard')}
                    className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs border border-stone-700"
                  >
                    B-OS v2.0
                  </button>
                  <button
                    onClick={() => loadOsTemplate('hello')}
                    className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs border border-stone-700"
                  >
                    Hello World
                  </button>
                  <button
                    onClick={() => loadOsTemplate('couleurs')}
                    className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs border border-stone-700"
                  >
                    Palette Démo
                  </button>
                </div>
              </div>

              {osFeedback && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>{osFeedback}</span>
                </div>
              )}

              <div className="relative border border-stone-800 rounded-xl overflow-hidden bg-stone-950 font-mono">
                <textarea
                  value={editedOsCode}
                  onChange={(e) => setEditedOsCode(e.target.value)}
                  rows={14}
                  className="w-full p-4 bg-transparent text-emerald-300 font-mono text-xs leading-relaxed outline-none resize-y"
                  placeholder="// Écrivez ou collez le code de votre système d'exploitation ici..."
                  spellCheck={false}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <span className="text-xs text-stone-400">
                  {editedOsCode.split('\n').length} lignes · Encodage bas-niveau binaire
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      ordinateur.os.passerEnModeBiosVierge();
                      setOsFeedback("Mémoire vidée : Ordinateur réinitialisé en mode Matériel Brut (ROM BIOS).");
                      onRefresh();
                    }}
                    className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-amber-400 rounded-lg text-xs font-semibold border border-stone-700 transition-colors"
                  >
                    Vider l'OS (Mode Brut BIOS)
                  </button>

                  <button
                    onClick={handleApplyOsCode}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 rounded-lg text-xs font-bold transition-colors shadow"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Recompiler & Injecter l'OS</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INJECTEUR JSON / CPU */}
          {activeTab === 'json_cpu' && (
            <div className="space-y-4">
              <div className="mb-3">
                <h3 className="text-xs font-bold text-stone-200 uppercase tracking-wider">
                  Injecteur d'instructions JSON & Programmes
                </h3>
                <p className="text-[11px] text-stone-400">
                  Injectez directement des tableaux d'instructions bas-niveau avec opcodes, registres et opérandes.
                </p>
              </div>
              <InstructionEditor
                currentInstructions={computer.instructions}
                onLoadProgram={onLoadProgram}
                currentPC={computer.registers.PC}
                isRunning={isRunning}
                onApplyPreset={onApplyPreset}
              />
            </div>
          )}

          {/* TAB 4: CPU & REGISTRES */}
          {activeTab === 'cpu' && (
            <div className="space-y-4">
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
            </div>
          )}

          {/* TAB 5: INDEX DBD (RAM) */}
          {activeTab === 'dbd' && (
            <div className="space-y-4">
              <DbdIndexVisualizer
                memory={computer.memory}
                onRefresh={onRefresh}
              />
            </div>
          )}

          {/* TAB 6: MEMOIRE RAM HEX */}
          {activeTab === 'memory' && (
            <div className="space-y-4">
              <MemoryViewer
                memory={computer.memory}
                currentPC={computer.registers.PC}
                currentSP={computer.registers.SP}
                onWriteCell={onWriteCell}
              />
            </div>
          )}

          {/* TAB 7: DISQUE VIRTUEL */}
          {activeTab === 'disk' && (
            <div className="space-y-4">
              <DiskManager
                disk={computer.disk}
                onFormatDisk={onFormatDisk}
                onReadSectorToRam={onReadSectorToRam}
                onWriteRamToSector={onWriteRamToSector}
                irq2Pending={computer.irq2Pending}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
