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
  const [editedOsCode, setEditedOsCode] = useState<string>(ordinateur.os.codeSourceOS);
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
    ordinateur.os.rechargerCodeOS(editedOsCode);
    setOsFeedback("Noyau OS rechargé et injecté avec succès !");
    onRefresh();
    setTimeout(() => setOsFeedback(null), 3000);
  };

  const loadOsTemplate = (type: 'standard' | 'hello' | 'couleurs') => {
    let code = '';
    if (type === 'hello') {
      code = `// ==========================================
// NOYAU B-OS : PROGRAMME MINIMAL "HELLO WORLD"
// ==========================================
// Ce programme affiche un message de bienvenue en binaire
// sur l'écran virtuel 330x165 et joue un son matériel.

INIT_OS:
  CLEAR_SCREEN              // 0b00000101
  SET_COLOR 0b0011          // Cyan Rétro
  DRAW_BOX 40, 40, 250, 80   // Rectangle de fenêtre

  SET_COLOR 0b0001          // Vert Phosphore
  PRINT 60, 60, "HELLO WORLD !"
  PRINT 60, 75, "SYSTEME D'EXPLOITATION VIRTUEL B-OS"
  PRINT 60, 90, "100% BINAIRE - MONITEUR 330x165"

  BEEP 880                  // Bip sonore 880 Hz
  HALT                      // Fin de boot
`;
    } else if (type === 'couleurs') {
      code = `// ==========================================
// NOYAU B-OS : DEMONSTRATION PALETTE COULEURS
// ==========================================
// Affiche les 16 nuances de la palette binaire 4-bits

INIT_PALETTE_TEST:
  CLEAR_SCREEN
  PRINT 10, 10, "=== TEST PALETTE BINAIRE 16 COULEURS ==="

  DRAW_COLOR_BAR 0b0001, "0b0001 VERT PHOSPHORE"
  DRAW_COLOR_BAR 0b0010, "0b0010 AMBRE CHAUD"
  DRAW_COLOR_BAR 0b0011, "0b0011 CYAN RETRO"
  DRAW_COLOR_BAR 0b0100, "0b0100 BLANC PAPIER"
  DRAW_COLOR_BAR 0b0101, "0b0101 ROUGE ALERTE"
  DRAW_COLOR_BAR 0b0110, "0b0110 JAUNE ELECTRIQUE"
  DRAW_COLOR_BAR 0b0111, "0b0111 MAGENTA NEON"
  DRAW_COLOR_BAR 0b1000, "0b1000 BLEU COBALT"

  PRINT 10, 140, "TOUT EST CALCULE EN BINAIRE SUR VRAM 330x165"
`;
    } else {
      code = `// ==========================================
// NOYAU B-OS v2.0 - ARCHITECTURE 100% BINAIRE
// ==========================================
// Pilotes matériels : Port USB 1 (Clavier), USB 2 (Souris), USB 3 (Flash)
// Affichage : VRAM 330x165 - Palette Binaire 16 Couleurs (0b0000 - 0b1111)

BOOT_SEQUENCE:
  0b00000001  // INIT_SUBSYSTEM_VGA_330X165
  0b00000010  // MOUNT_USB_HUB_PORTS_1_2_3
  0b00000011  // LOAD_DESKTOP_WINDOW_MANAGER
  0b00000100  // ENABLE_INTERRUPTS_IRQ0_IRQ1_IRQ2

UI_DESKTOP_STYLE:
  COLOR_BAR_TITLE = 0b0011     // Cyan Rétro
  COLOR_TEXT_MAIN = 0b0001     // Vert Phosphore
  COLOR_ACCENT    = 0b0010     // Ambre Chaud
  COLOR_HIGHLIGHT = 0b1011     // Blanc Curseur

LOOP:
  WAIT_FOR_EVENT
  HANDLE_USB_MOUSE_COORDS
  HANDLE_USB_KEYBOARD_SCANCODE
  REFRESH_VRAM_DISPLAY
  JUMP LOOP
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

                {/* Port USB 3 : Clé Flash */}
                <div className="p-4 bg-stone-900 border border-stone-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-stone-100 font-bold text-xs">
                      <Usb className="w-4 h-4 text-amber-400" />
                      <span>PORT USB 3 : CLÉ FLASH & STOCKAGE</span>
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded font-mono ${ordinateur.hubUsb.cleUsb.estBranchee ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-stone-800 text-stone-400'}`}>
                      {ordinateur.hubUsb.cleUsb.estBranchee ? 'CONNECTEE' : 'ABSENTE'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400">
                    Permet d'importer et sauvegarder des fichiers binaires (.bin) et du code d'application.
                  </p>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] font-mono text-stone-400">
                      Fichiers : <strong className="text-amber-300">{ordinateur.hubUsb.cleUsb.fichiers.length} fichiers</strong>
                    </span>
                    <button
                      onClick={() => {
                        ordinateur.hubUsb.basculerPort(3);
                        ordinateur.os.rafraichirBureau();
                        onRefresh();
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        ordinateur.hubUsb.cleUsb.estBranchee
                          ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500 hover:bg-amber-400 text-stone-950'
                      }`}
                    >
                      {ordinateur.hubUsb.cleUsb.estBranchee ? 'Éjecter la Clé USB' : 'Insérer la Clé USB'}
                    </button>
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
