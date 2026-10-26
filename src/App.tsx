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
  HardDrive,
} from 'lucide-react';

export default function App() {
  const computerRef = useRef<OrdinateurVirtuel>(new OrdinateurVirtuel());
  const computer = computerRef.current;

  const [tick, setTick] = useState<number>(0);
  const [isStudioOpen, setIsStudioOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'ports' | 'os_code' | 'json_cpu' | 'cpu' | 'dbd' | 'memory' | 'disk' | 'guide'>('guide');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentPreset, setCurrentPreset] = useState<OsPreset>(OS_PRESETS[0]);

  const forceUpdate = useCallback(() => {
    setTick((t) => (t + 1) % 1000000);
  }, []);

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

        {/* Zone 3: Actions principales */}
        <div className="flex items-center gap-2.5 shrink-0">
          {computer.os.modeDemarrage === 'bios_rom' && (
            <div className="flex items-center gap-2">
              {bootableUsb ? (
                <button
                  onClick={() => {
                    computer.booterDepuisCle();
                    forceUpdate();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-stone-950 transition-all shadow-md animate-pulse whitespace-nowrap"
                  title={`Démarrer le système "${bootableUsb.cle.nomSysteme}" depuis le Port USB ${bootableUsb.port}`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Booter Clé USB (Port {bootableUsb.port})</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    computer.activerAccesDisque(300, 3);
                    computer.os.tenterBootDepuisUsb();
                    forceUpdate();
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition-colors whitespace-nowrap"
                  title="Rescanner les ports USB 1, 2 et 3 à la recherche d'un disque bootable"
                >
                  <Usb className="w-3.5 h-3.5 text-amber-400" />
                  <span>Rescanner Ports USB</span>
                </button>
              )}

              <button
                onClick={() => {
                  computer.os.ouvrirBiosSetup();
                  forceUpdate();
                }}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-colors whitespace-nowrap"
                title="Accéder à la configuration CMOS BIOS"
              >
                <span>[F2] Setup</span>
              </button>
            </div>
          )}

          {computer.os.modeDemarrage === 'bios_setup' && (
            <button
              onClick={() => {
                computer.os.passerEnModeBiosVierge();
                forceUpdate();
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition-colors whitespace-nowrap"
            >
              <span>[ESC] Quitter Setup</span>
            </button>
          )}

          {computer.os.modeDemarrage === 'os_personnalise' && (
            <button
              onClick={() => {
                computer.os.verifierOuDeclencherAlerteSecurite('RESET_BIOS', 'ESC', 'Retour au BIOS', () => {
                  computer.activerAccesDisque(250, 2);
                  computer.os.passerEnModeBiosVierge();
                });
                forceUpdate();
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all whitespace-nowrap ${
                computer.os.alerteSecurite?.action === 'RESET_BIOS'
                  ? 'bg-rose-500 text-white border-rose-400 font-bold animate-pulse'
                  : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}
              title="Appuyez 2 fois sur [ESC] pour réinitialiser la machine et retourner au BIOS"
            >
              <span>{computer.os.alerteSecurite?.action === 'RESET_BIOS' ? 'Confirmer [ESC] ?' : '[ESC] Quitter OS'}</span>
            </button>
          )}

          {/* Bouton Éditeur & Flasheur Clé USB */}
          <button
            onClick={() => setIsStudioOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 rounded-lg text-xs font-bold transition-colors shadow-sm whitespace-nowrap"
            title="Écrire votre système et flasher sur la clé USB (Port 1, 2 ou 3)"
          >
            <Code className="w-3.5 h-3.5" />
            <span>Éditeur & Flasher Clé USB</span>
          </button>

          {/* Guide et manuel */}
          <button
            onClick={() => {
              setSettingsInitialTab('guide');
              setIsSettingsOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-semibold transition-colors shadow-sm whitespace-nowrap"
            title="Ouvrir le guide complet de l'assembleur et du développement d'OS"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Manuel & Guide OS</span>
          </button>

          {/* Redémarrage matériel */}
          <button
            onClick={handleReset}
            title="Redémarrer l'ordinateur virtuel"
            className="p-1.5 text-xs text-stone-300 bg-stone-800 hover:bg-stone-700 rounded-lg border border-stone-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Menu ports & réglages */}
          <button
            onClick={() => {
              setSettingsInitialTab('ports');
              setIsSettingsOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white rounded-lg border border-stone-700 transition-colors whitespace-nowrap"
          >
            <Sliders className="w-3.5 h-3.5 text-stone-400" />
            <span>Ports & Réglages</span>
          </button>
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
