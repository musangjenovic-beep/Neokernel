import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VirtualComputer } from './core/cpu';
import { OS_PRESETS, OsPreset } from './core/osPrograms';
import { Header } from './components/Header';
import { VirtualScreen } from './components/VirtualScreen';
import { VirtualKeyboard } from './components/VirtualKeyboard';
import { SettingsModal } from './components/SettingsModal';
import { Instruction } from './types/virtualComputer';
import { Sliders, Sparkles, Terminal } from 'lucide-react';

export default function App() {
  // Main Virtual Computer instance
  const computerRef = useRef<VirtualComputer>(new VirtualComputer());
  const computer = computerRef.current;

  // React state for reactive UI updates
  const [tick, setTick] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [clockSpeedHz, setClockSpeedHz] = useState<number>(20);
  const [currentPreset, setCurrentPreset] = useState<OsPreset>(OS_PRESETS[0]);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Force re-render helper
  const forceUpdate = useCallback(() => {
    setTick((t) => (t + 1) % 1000000);
  }, []);

  // Initialize computer with default preset on mount
  useEffect(() => {
    applyPreset(OS_PRESETS[0], true);
    const timer = setTimeout(() => forceUpdate(), 60);
    return () => clearTimeout(timer);
  }, []);

  const applyPreset = (preset: OsPreset, autoExecute: boolean = true) => {
    computer.reset(false);

    // Apply initial RAM memory setup (e.g. IVT vectors or data records)
    if (preset.defaultMemorySetup) {
      for (const item of preset.defaultMemorySetup) {
        computer.memory.write(item.addr, item.val);
      }
    }

    computer.loadProgram(preset.instructions, 0x0080);
    setCurrentPreset(preset);

    if (autoExecute) {
      // Execute the instructions immediately so the screen displays the result right away
      let limit = 0;
      while (computer.stepInstruction() && limit < 500) {
        limit++;
      }
      computer.isRunning = false;
      setIsRunning(false);
    } else {
      setIsRunning(false);
    }

    forceUpdate();
  };

  // Clock Execution Loop
  useEffect(() => {
    if (!isRunning) return;

    let timeoutId: any;
    let animId: any;

    if (clockSpeedHz <= 50) {
      const intervalMs = Math.max(10, Math.floor(1000 / clockSpeedHz));
      const runStep = () => {
        const canContinue = computer.stepInstruction();
        forceUpdate();
        if (canContinue && computer.isRunning) {
          timeoutId = setTimeout(runStep, intervalMs);
        } else {
          setIsRunning(false);
        }
      };
      timeoutId = setTimeout(runStep, intervalMs);
    } else {
      // High-speed batch execution (10 to 30 instructions per frame)
      const batchPerFrame = Math.floor(clockSpeedHz / 60) || 5;
      const runRaf = () => {
        let ok = true;
        for (let i = 0; i < batchPerFrame; i++) {
          ok = computer.stepInstruction();
          if (!ok) break;
        }
        forceUpdate();
        if (ok && computer.isRunning) {
          animId = requestAnimationFrame(runRaf);
        } else {
          setIsRunning(false);
        }
      };
      animId = requestAnimationFrame(runRaf);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isRunning, clockSpeedHz, forceUpdate]);

  // Handlers
  const handleToggleRun = () => {
    if (isRunning) {
      computer.isRunning = false;
      setIsRunning(false);
    } else {
      computer.isRunning = true;
      setIsRunning(true);
    }
    forceUpdate();
  };

  const handleStepInstruction = () => {
    computer.stepInstruction();
    forceUpdate();
  };

  const handleStepMicroCycle = () => {
    computer.stepCycle();
    forceUpdate();
  };

  const handleReset = () => {
    computer.reset(true);
    applyPreset(currentPreset);
  };

  const handleKeyPress = (code: number) => {
    computer.pushKey(code);
    forceUpdate();
  };

  const handleClearScreen = (color: number) => {
    computer.screenBuffer.fill(color & 15);
    computer.screenChanged = true;
    forceUpdate();
  };

  const handleDrawPixelTest = (x: number, y: number, color: number) => {
    computer.screenBuffer[(y & 31) * 32 + (x & 31)] = color & 15;
    computer.screenChanged = true;
    forceUpdate();
  };

  const handleLoadProgram = (instructions: Instruction[], baseAddr: number = 0x0080) => {
    computer.loadProgram(instructions, baseAddr);
    forceUpdate();
  };

  const handleWriteMemoryCell = (address: number, val: number) => {
    computer.memory.write(address, val);
    forceUpdate();
  };

  const handleFormatDisk = () => {
    for (let s = 0; s < 8; s++) {
      computer.disk.sectors[s].fill(0);
    }
    forceUpdate();
  };

  const handleReadSectorToRam = (sector: number, ramAddr: number) => {
    const secData = computer.disk.sectors[sector & 7];
    for (let i = 0; i < 64; i++) {
      computer.memory.write(ramAddr + i, secData[i]);
    }
    computer.irq2Pending = true;
    forceUpdate();
  };

  const handleWriteRamToSector = (sector: number, ramAddr: number) => {
    const secData = computer.disk.sectors[sector & 7];
    for (let i = 0; i < 64; i++) {
      secData[i] = computer.memory.read(ramAddr + i);
    }
    computer.irq2Pending = true;
    forceUpdate();
  };

  const handleToggleTimer = () => {
    computer.timerEnabled = !computer.timerEnabled;
    forceUpdate();
  };

  const handleSetTimerInterval = (interval: number) => {
    computer.timerInterval = interval;
    forceUpdate();
  };

  // Get current IVT addresses for display in modal
  const ivtAddresses = [
    { vector: 0, name: 'Boot / Réinitialisation', addr: computer.memory.read(0x0000), irqName: 'RESET' },
    { vector: 1, name: 'Horloge Matérielle (Timer)', addr: computer.memory.read(0x0001), irqName: 'IRQ0' },
    { vector: 2, name: 'Clavier Matériel (Frappe)', addr: computer.memory.read(0x0002), irqName: 'IRQ1' },
    { vector: 3, name: 'Contrôleur de Stockage (Disque)', addr: computer.memory.read(0x0003), irqName: 'IRQ2' },
    { vector: 4, name: 'Appels Système (Syscall INT)', addr: computer.memory.read(0x0004), irqName: 'SWI' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* 3-Zone Clean Top Bar */}
      <Header
        isRunning={isRunning}
        onToggleRun={handleToggleRun}
        onStepInstruction={handleStepInstruction}
        onReset={handleReset}
        onOpenSettings={() => setIsSettingsOpen(true)}
        clockSpeedHz={clockSpeedHz}
        setClockSpeedHz={setClockSpeedHz}
        currentOsName={currentPreset.name}
      />

      {/* Main Focus: Pure Computer Workstation (Screen + Keyboard Only) */}
      <main className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 w-full max-w-4xl mx-auto space-y-4">
        {/* Virtual Monitor */}
        <VirtualScreen
          screenBuffer={computer.screenBuffer}
          isRunning={isRunning}
          tick={tick}
          onClearScreen={handleClearScreen}
          onDrawPixelTest={handleDrawPixelTest}
        />

        {/* Virtual Keyboard */}
        <VirtualKeyboard
          onKeyPress={handleKeyPress}
          keyboardBuffer={computer.keyboardBuffer}
          irq1Pending={computer.irq1Pending}
        />

        {/* Interactive Quick Bar */}
        <div className="flex flex-wrap items-center justify-between w-full max-w-2xl px-4 py-2 bg-slate-900/60 border border-slate-800/80 rounded-xl text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Programme injecté :</span>
            <strong className="text-cyan-300 font-semibold">{currentPreset.name}</strong>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                computer.reset(true);
                computer.screenBuffer.fill(0);
                computer.loadProgram(currentPreset.instructions, 0x0080);
                computer.isRunning = true;
                setIsRunning(true);
                forceUpdate();
              }}
              className="flex items-center gap-1.5 px-3 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-medium transition-colors"
            >
              <span>▶ Rejouer l'animation</span>
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Voir le Code JSON & Réglages</span>
            </button>
          </div>
        </div>
      </main>

      {/* Hardware Architecture & Settings Modal (Everything else goes here) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        computer={computer}
        isRunning={isRunning}
        onStepMicroCycle={handleStepMicroCycle}
        onLoadProgram={handleLoadProgram}
        onApplyPreset={applyPreset}
        onWriteCell={handleWriteMemoryCell}
        onFormatDisk={handleFormatDisk}
        onReadSectorToRam={handleReadSectorToRam}
        onWriteRamToSector={handleWriteRamToSector}
        onToggleTimer={handleToggleTimer}
        onSetTimerInterval={handleSetTimerInterval}
        ivtAddresses={ivtAddresses}
        onRefresh={forceUpdate}
      />
    </div>
  );
}
