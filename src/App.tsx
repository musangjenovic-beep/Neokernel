import React, { useState, useEffect, useRef, useCallback } from 'react';
import { OrdinateurVirtuel } from './hardware/computer';
import { PhysicalMonitor } from './components/PhysicalMonitor';
import { PhysicalKeyboard } from './components/PhysicalKeyboard';
import { PhysicalMouse } from './components/PhysicalMouse';
import { LanguageStudioDrawer } from './components/LanguageStudioDrawer';
import { SettingsModal } from './components/SettingsModal';
import { OS_PRESETS, OsPreset } from './core/osPrograms';
import { Instruction } from './types/virtualComputer';
import {
  Code,
  Sliders,
  RotateCcw,
  Cpu,
  BookOpen,
  Play,
  Usb,
  Menu,
  ChevronDown,
  X,
  Power,
  HardDrive,
} from 'lucide-react';

export default function App() {
  const computerRef = useRef<OrdinateurVirtuel>(new OrdinateurVirtuel());
  const computer = computerRef.current;

  const [tick, setTick] = useState<number>(0);
  const [isStudioOpen, setIsStudioOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'ports' | 'os_code' | 'json_cpu' | 'cpu' | 'dbd' | 'memory' | 'disk' | 'guide'>('guide');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentPreset, setCurrentPreset] = useState<OsPreset>(OS_PRESETS[0]);

  const forceUpdate = useCallback(() => {
    setTick((t) => (t + 1) % 1000000);
  }, []);

  // Fermeture du menu déroulant lors d'un clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Initialisation et démarrage matériel de l'ordinateur virtuel
  useEffect(() => {
    computer.onDemandeEditeur = () => setIsStudioOpen(true);
    computer.demarrer();
    const timer = setTimeout(() => {
      computer.os.rafraichirBureau();
      forceUpdate();
    }, 60);
    return () => clearTimeout(timer);
  }, [computer, forceUpdate]);

  const handleReset = () => {
    computer.redemarrer();
    forceUpdate();
  };

  const handleStepMicroCycle = () => {
    computer.cpu.stepCycle();
    forceUpdate();
  };

  const handleLoadProgram = (instructions: Instruction[], baseAddr: number = 0x0080) => {
    computer.cpu.loadProgram(instructions, baseAddr);
    forceUpdate();
  };

  const handleApplyPreset = (preset: OsPreset) => {
    computer.cpu.reset(false);
    if (preset.defaultMemorySetup) {
      for (const item of preset.defaultMemorySetup) {
        computer.cpu.memory.write(item.addr, item.val);
      }
    }
    computer.cpu.loadProgram(preset.instructions, 0x0080);
    setCurrentPreset(preset);
    setIsRunning(false);
    forceUpdate();
  };

  const handleWriteMemoryCell = (address: number, val: number) => {
    computer.cpu.memory.write(address, val);
    forceUpdate();
  };

  const handleFormatDisk = () => {
    computer.activerAccesDisque(500, 5);
    for (let s = 0; s < 8; s++) {
      computer.cpu.disk.sectors[s].fill(0);
    }
    forceUpdate();
  };

  const handleReadSectorToRam = (sector: number, ramAddr: number) => {
    computer.activerAccesDisque(350, 3);
    const secData = computer.cpu.disk.sectors[sector & 7];
    for (let i = 0; i < 64; i++) {
      computer.cpu.memory.write(ramAddr + i, secData[i]);
    }
    computer.cpu.irq2Pending = true;
    forceUpdate();
  };

  const handleWriteRamToSector = (sector: number, ramAddr: number) => {
    computer.activerAccesDisque(350, 3);
    const secData = computer.cpu.disk.sectors[sector & 7];
    for (let i = 0; i < 64; i++) {
      secData[i] = computer.cpu.memory.read(ramAddr + i);
    }
    computer.cpu.irq2Pending = true;
    forceUpdate();
  };

  const handleToggleTimer = () => {
    computer.cpu.timerEnabled = !computer.cpu.timerEnabled;
    forceUpdate();
  };

  const handleSetTimerInterval = (interval: number) => {
    computer.cpu.timerInterval = interval;
    forceUpdate();
  };

  const ivtAddresses = [
    { vector: 0, name: 'Boot / Reset', addr: computer.cpu.memory.read(0x0000), irqName: 'RESET' },
    { vector: 1, name: 'Horloge Matérielle (Timer)', addr: computer.cpu.memory.read(0x0001), irqName: 'IRQ0' },
    { vector: 2, name: 'Clavier Matériel (Frappe)', addr: computer.cpu.memory.read(0x0002), irqName: 'IRQ1' },
    { vector: 3, name: 'Contrôleur Disque', addr: computer.cpu.memory.read(0x0003), irqName: 'IRQ2' },
    { vector: 4, name: 'Appels Système (Syscall)', addr: computer.cpu.memory.read(0x0004), irqName: 'SWI' },
  ];

  const bootableUsb = computer.hubUsb.trouverCleBootable();

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-200">
      {/* Barre supérieure épurée */}
      <header className="flex items-center justify-between gap-6 px-4 sm:px-6 py-3 bg-stone-900 border-b border-stone-800 text-stone-100">
        {/* Zone 1: Identité du PC Virtuel */}
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Cpu className="w-4 h-4" />
          </div>
          <span className="text-base font-semibold tracking-tight text-white">
            VirtuArch <span className="text-emerald-400 font-mono text-xs font-normal">PC Binaire (330×165)</span>
          </span>
        </div>

        {/* Zone 2: Télémétrie d'architecture discrète */}
        <div className="hidden md:flex items-center gap-4 text-xs font-mono text-stone-400 whitespace-nowrap truncate">
          <span>
            État :{' '}
            <strong
              className={
                computer.os.modeDemarrage === 'bios_rom'
                  ? 'text-amber-400 font-medium'
                  : computer.os.modeDemarrage === 'bios_setup'
                  ? 'text-cyan-400 font-medium'
                  : 'text-emerald-300 font-medium'
              }
            >
              {computer.os.modeDemarrage === 'bios_rom'
                ? 'ROM BIOS v2.4 (POST / Mémoire Vierge)'
                : computer.os.modeDemarrage === 'bios_setup'
                ? 'BIOS CMOS Setup Utility'
                : `Système Personnalisé: ${computer.os.nomOsActif || 'OS_PERSO'}`}
            </strong>
          </span>
          <span>·</span>
          <span>RAM : <strong className="text-stone-200">64 Ko (Zero 0x0000)</strong></span>
          <span>·</span>
          <span>VRAM : <strong className="text-emerald-400">330×165 Binaire</strong></span>
        </div>

        {/* Zone 3: Menu Principal Unique (Regroupe toutes les commandes et outils) */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs rounded-lg shadow-md transition-all active:scale-95"
            title="Ouvrir le menu principal du système VirtuArch"
          >
            <Menu className="w-4 h-4" />
            <span>Menu Système</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Menu Déroulant Élégant */}
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl bg-stone-900 border border-stone-800 shadow-2xl z-50 overflow-hidden font-sans py-1 divide-y divide-stone-800/80 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Section 1: Développement OS & Manuel */}
              <div className="p-1">
                <button
                  onClick={() => {
                    setIsStudioOpen(true);
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors text-left"
                >
                  <Code className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-bold">Éditeur d'OS & Flasheur USB</div>
                    <div className="text-[10px] text-stone-400 font-normal">
                      Coder en BitScript & flasher sur clé USB
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setSettingsInitialTab('guide');
                    setIsSettingsOpen(true);
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition-colors text-left"
                >
                  <BookOpen className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <div className="font-bold">Manuel & Guide OS</div>
                    <div className="text-[10px] text-stone-400 font-normal">
                      Assembleur, commandes RGB, jeux & OS
                    </div>
                  </div>
                </button>
              </div>

              {/* Section 2: Boot & BIOS */}
              <div className="p-1">
                {bootableUsb && (
                  <button
                    onClick={() => {
                      computer.booterDepuisCle();
                      forceUpdate();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors text-left"
                  >
                    <Play className="w-4 h-4 fill-current shrink-0" />
                    <div>
                      <div>Booter Clé USB (Port {bootableUsb.port})</div>
                      <div className="text-[10px] text-stone-400 font-normal">
                        Lancer "{bootableUsb.cle.nomSysteme}"
                      </div>
                    </div>
                  </button>
                )}

                <button
                  onClick={() => {
                    computer.activerAccesDisque(300, 3);
                    computer.os.tenterBootDepuisUsb();
                    forceUpdate();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-stone-300 hover:bg-stone-800 rounded-lg transition-colors text-left"
                >
                  <Usb className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Rescanner Ports USB 1, 2, 3</span>
                </button>

                <button
                  onClick={() => {
                    computer.os.ouvrirBiosSetup();
                    forceUpdate();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-stone-300 hover:bg-stone-800 rounded-lg transition-colors text-left"
                >
                  <HardDrive className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>BIOS CMOS Setup Utility [F2]</span>
                </button>

                {computer.os.modeDemarrage === 'os_personnalise' && (
                  <button
                    onClick={() => {
                      computer.os.passerEnModeBiosVierge();
                      forceUpdate();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors text-left"
                  >
                    <RotateCcw className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Quitter OS (Retour BIOS)</span>
                  </button>
                )}
              </div>

              {/* Section 3: Configuration & Matériel */}
              <div className="p-1">
                <button
                  onClick={() => {
                    setSettingsInitialTab('ports');
                    setIsSettingsOpen(true);
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-stone-300 hover:bg-stone-800 rounded-lg transition-colors text-left"
                >
                  <Sliders className="w-4 h-4 text-stone-400 shrink-0" />
                  <span>Ports E/S & Réglages Matériels</span>
                </button>

                <button
                  onClick={() => {
                    handleReset();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors text-left"
                >
                  <RotateCcw className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Redémarrer la Machine (Reset)</span>
                </button>

                <button
                  onClick={() => {
                    if (computer.estAllume) {
                      computer.eteindre();
                    } else {
                      computer.demarrer();
                    }
                    forceUpdate();
                    setIsMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg transition-colors text-left ${
                    computer.estAllume
                      ? 'text-rose-400 hover:bg-rose-500/10'
                      : 'text-emerald-400 hover:bg-emerald-500/10'
                  }`}
                >
                  <Power className="w-4 h-4 shrink-0" />
                  <span>
                    {computer.estAllume ? "Éteindre l'ordinateur" : "Allumer l'ordinateur"}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Poste de travail épuré : Écran au centre, Clavier et Souris en bas côte-à-côte */}
      <main className="flex-1 flex flex-col items-center justify-center p-3 sm:p-5 w-full max-w-5xl mx-auto space-y-4">
        {/* 1. Écran Moniteur Virtuel CRT (330x165 natif, bezel épuré sans boutons) */}
        <PhysicalMonitor computer={computer} onRefresh={forceUpdate} />

        {/* 2. Périphériques d'Entrée sur le Bureau : Clavier et Souris côte-à-côte */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
          <div className="md:col-span-7 flex flex-col">
            <PhysicalKeyboard clavier={computer.clavier} onRefresh={forceUpdate} />
          </div>
          <div className="md:col-span-5 flex flex-col">
            <PhysicalMouse computer={computer} onRefresh={forceUpdate} />
          </div>
        </div>
      </main>

      {/* Éditeur de Système d'Exploitation & Flasheur Clé USB */}
      <LanguageStudioDrawer
        computer={computer}
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        onRefresh={forceUpdate}
      />

      {/* Panneau Réglages (Ports E/S, CPU, RAM) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        ordinateur={computer}
        computer={computer.cpu}
        isRunning={isRunning}
        onStepMicroCycle={handleStepMicroCycle}
        onLoadProgram={handleLoadProgram}
        onApplyPreset={handleApplyPreset}
        onWriteCell={handleWriteMemoryCell}
        onFormatDisk={handleFormatDisk}
        onReadSectorToRam={handleReadSectorToRam}
        onWriteRamToSector={handleWriteRamToSector}
        onToggleTimer={handleToggleTimer}
        onSetTimerInterval={handleSetTimerInterval}
        ivtAddresses={ivtAddresses}
        onRefresh={forceUpdate}
        initialTab={settingsInitialTab}
      />
    </div>
  );
}
