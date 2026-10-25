import React, { useEffect, useState, useRef } from 'react';
import { Keyboard, Volume2, VolumeX, CornerDownLeft } from 'lucide-react';

interface VirtualKeyboardProps {
  onKeyPress: (keyCode: number) => void;
  keyboardBuffer: number[];
  irq1Pending: boolean;
}

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  onKeyPress,
  keyboardBuffer,
  irq1Pending,
}) => {
  const [lastPressed, setLastPressed] = useState<string | null>(null);
  const [activeKeyCode, setActiveKeyCode] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play mechanical key click sound via Web Audio API
  const playKeySound = () => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140 + Math.random() * 40, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {
      // Audio not permitted or supported, silent fallback
    }
  };

  // Capture physical keyboard typing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture if user is typing in a textarea or modal input!
      if (['TEXTAREA', 'INPUT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      e.preventDefault();
      const code = e.key.length === 1 ? e.key.charCodeAt(0) : e.keyCode;
      onKeyPress(code);
      setActiveKeyCode(code);
      playKeySound();
      setLastPressed(`${e.key} (ASCII ${code})`);

      setTimeout(() => setActiveKeyCode(null), 150);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onKeyPress, soundEnabled]);

  const triggerKey = (label: string, asciiCode: number) => {
    onKeyPress(asciiCode);
    setActiveKeyCode(asciiCode);
    playKeySound();
    setLastPressed(`${label} (ASCII ${asciiCode})`);
    setTimeout(() => setActiveKeyCode(null), 150);
  };

  const KEYBOARD_ROWS = [
    [
      { label: 'ESC', code: 27 },
      { label: '1', code: 49 },
      { label: '2', code: 50 },
      { label: '3', code: 51 },
      { label: '4', code: 52 },
      { label: '5', code: 53 },
      { label: '6', code: 54 },
      { label: '7', code: 55 },
      { label: '8', code: 56 },
      { label: '9', code: 57 },
      { label: '0', code: 48 },
      { label: 'BKSP', code: 8 },
    ],
    [
      { label: 'TAB', code: 9 },
      { label: 'Q', code: 81 },
      { label: 'W', code: 87 },
      { label: 'E', code: 69 },
      { label: 'R', code: 82 },
      { label: 'T', code: 84 },
      { label: 'Y', code: 89 },
      { label: 'U', code: 85 },
      { label: 'I', code: 73 },
      { label: 'O', code: 79 },
      { label: 'P', code: 80 },
    ],
    [
      { label: 'A', code: 65 },
      { label: 'S', code: 83 },
      { label: 'D', code: 68 },
      { label: 'F', code: 70 },
      { label: 'G', code: 71 },
      { label: 'H', code: 72 },
      { label: 'J', code: 74 },
      { label: 'K', code: 75 },
      { label: 'L', code: 76 },
      { label: 'ENTRÉE', code: 13, wide: true },
    ],
    [
      { label: 'Z', code: 90 },
      { label: 'X', code: 88 },
      { label: 'C', code: 67 },
      { label: 'V', code: 86 },
      { label: 'B', code: 66 },
      { label: 'N', code: 78 },
      { label: 'M', code: 77 },
      { label: '▲', code: 38 },
      { label: '▼', code: 40 },
      { label: '◄', code: 37 },
      { label: '►', code: 39 },
    ],
  ];

  return (
    <div className="w-full flex flex-col items-center">
      {/* Keyboard Integrated Chassis */}
      <div className="w-full max-w-2xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-2xl relative select-none">
        {/* Chassis Top Bar: Name, Buffer & IRQ1 Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 px-1 text-xs">
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
            <Keyboard className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-slate-300">CLAVIER VIRTUARCH</span>
            <span>·</span>
            <span>Port 4</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Audio Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Désactiver le clic mécanique' : 'Activer le clic mécanique'}
              className="text-slate-400 hover:text-white transition-colors"
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-600" />
              )}
            </button>

            {/* IRQ1 Latch LED Indicator */}
            <div className="flex items-center gap-1.5 font-mono text-[10px]">
              <span
                className={`w-2 h-2 rounded-full transition-all ${
                  irq1Pending
                    ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]'
                    : 'bg-slate-700'
                }`}
              />
              <span className={irq1Pending ? 'text-amber-300 font-bold' : 'text-slate-500'}>
                {irq1Pending ? 'IRQ1 ACTIVE' : 'IRQ1 PRÊTE'}
              </span>
            </div>
          </div>
        </div>

        {/* Live Keystroke Buffer Indicator */}
        <div className="mb-3 px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500">Tampon E/S :</span>
            {keyboardBuffer.length > 0 ? (
              <div className="flex items-center gap-1">
                {keyboardBuffer.map((b, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 text-cyan-300 rounded text-[11px]"
                  >
                    {b >= 32 && b <= 126 ? String.fromCharCode(b) : `0x${b.toString(16)}`}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-slate-500 italic text-[11px]">En attente de frappe</span>
            )}
          </div>

          {lastPressed && (
            <span className="text-slate-400 text-[11px]">
              Dernière touche : <strong className="text-white">{lastPressed}</strong>
            </span>
          )}
        </div>

        {/* Physical Key Caps Matrix */}
        <div className="p-2 sm:p-3 bg-slate-950/90 border border-slate-800 rounded-xl space-y-1.5 shadow-inner">
          {KEYBOARD_ROWS.map((row, rIdx) => (
            <div key={rIdx} className="flex gap-1 sm:gap-1.5 justify-center">
              {row.map((k) => {
                const isPressed = activeKeyCode === k.code;
                return (
                  <button
                    key={k.label}
                    onClick={() => triggerKey(k.label, k.code)}
                    className={`px-1 sm:px-2 py-1.5 rounded-md text-[11px] sm:text-xs font-mono font-medium transition-all shadow ${
                      isPressed
                        ? 'bg-cyan-500 text-slate-950 translate-y-0.5 shadow-none font-bold'
                        : k.wide
                        ? 'flex-1 max-w-[85px] bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:translate-y-0.5'
                        : 'w-7 sm:w-9 h-8 sm:h-9 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 active:translate-y-0.5'
                    }`}
                  >
                    {k.label}
                  </button>
                );
              })}
            </div>
          ))}

          {/* Space Bar Row */}
          <div className="flex justify-center pt-1">
            <button
              onClick={() => triggerKey('ESPACE', 32)}
              className={`w-44 sm:w-64 py-2 rounded-md text-xs font-mono transition-all shadow ${
                activeKeyCode === 32
                  ? 'bg-cyan-500 text-slate-950 translate-y-0.5 shadow-none font-bold'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 active:translate-y-0.5'
              }`}
            >
              ESPACE (ASCII 32)
            </button>
          </div>
        </div>

        {/* Subtitle Hint */}
        <div className="mt-2 text-center text-[10px] text-slate-500">
          Vous pouvez taper directement sur le vrai clavier physique de votre ordinateur !
        </div>
      </div>
    </div>
  );
};
