import React, { useEffect, useState } from 'react';
import { ClavierUSB } from '../hardware/keyboard';
import { Keyboard } from 'lucide-react';

interface PhysicalKeyboardProps {
  clavier: ClavierUSB;
  onRefresh: () => void;
}

export const PhysicalKeyboard: React.FC<PhysicalKeyboardProps> = ({ clavier, onRefresh }) => {
  const [activeKeyCode, setActiveKeyCode] = useState<number | null>(null);

  // Écoute du clavier physique de l'ordinateur
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['TEXTAREA', 'INPUT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === 'F5' || (e.ctrlKey && e.key.toLowerCase() === 'r')) {
        return;
      }
      e.preventDefault();

      let nom = e.key;
      let code = e.keyCode;
      if (e.key.length === 1) {
        nom = e.key.toUpperCase();
        code = nom.charCodeAt(0);
      } else if (/^F[1-9]$|^F1[0-2]$/i.test(e.key)) {
        nom = e.key.toUpperCase();
        const fNum = parseInt(nom.substring(1), 10);
        code = 111 + fNum; // F1 = 112, F2 = 113, ..., F12 = 123
      }

      clavier.frapperTouche(code, nom);
      setActiveKeyCode(code);
      setTimeout(() => setActiveKeyCode(null), 140);
      onRefresh();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clavier, onRefresh]);

  const triggerKey = (label: string, code: number) => {
    clavier.frapperTouche(code, label);
    setActiveKeyCode(code);
    setTimeout(() => setActiveKeyCode(null), 140);
    onRefresh();
  };

  interface KeyDef {
    label: string;
    code: number;
    wide?: boolean;
    isFunction?: boolean;
    highlight?: boolean;
  }

  const KEYBOARD_ROWS: KeyDef[][] = [
    // Ligne des Touches de Fonction (F1 à F12 + ESC)
    [
      { label: 'ESC', code: 27, isFunction: true },
      { label: 'F1', code: 112, isFunction: true },
      { label: 'F2', code: 113, isFunction: true, highlight: true }, // BIOS Setup
      { label: 'F3', code: 114, isFunction: true, highlight: true }, // Éditeur OS
      { label: 'F4', code: 115, isFunction: true },
      { label: 'F5', code: 116, isFunction: true },
      { label: 'F6', code: 117, isFunction: true },
      { label: 'F7', code: 118, isFunction: true },
      { label: 'F8', code: 119, isFunction: true },
      { label: 'F9', code: 120, isFunction: true },
      { label: 'F10', code: 121, isFunction: true },
      { label: 'F11', code: 122, isFunction: true },
      { label: 'F12', code: 123, isFunction: true },
    ],
    // Ligne des Chiffres
    [
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
      { label: '⌫', code: 8, wide: true },
    ],
    // Ligne QWERTY 1
    [
      { label: 'TAB', code: 9, wide: true },
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
    // Ligne QWERTY 2
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
    // Ligne QWERTY 3 + Flèches directionnelles
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
    <div className="w-full h-full bg-stone-900 border-2 border-stone-800 rounded-xl p-3 shadow-xl select-none flex flex-col justify-between">
      {/* En-tête épuré */}
      <div className="flex items-center justify-between gap-2 mb-2 px-1 text-xs font-mono">
        <div className="flex items-center gap-1.5 text-stone-200">
          <Keyboard className="w-4 h-4 text-emerald-400" />
          <span className="font-bold tracking-wider">CLAVIER</span>
          <span
            className={`w-2 h-2 rounded-full ${
              clavier.estBranche ? 'bg-emerald-400' : 'bg-rose-500'
            }`}
          />
        </div>

        <div className="text-[11px] text-stone-400 font-mono">
          <span className="text-stone-500">E/S: </span>
          <strong className="text-emerald-300 font-mono">
            {clavier.dernierPaquet?.octetBinaire || '0b00000000'}
          </strong>
        </div>
      </div>

      {/* Matrice de Touches avec Rangée F1..F12 */}
      <div className="p-2 sm:p-2.5 bg-stone-950 border border-stone-800 rounded-lg space-y-1 sm:space-y-1.5 shadow-inner flex-1 flex flex-col justify-center">
        {KEYBOARD_ROWS.map((row, rIdx) => (
          <div key={rIdx} className="flex gap-1 sm:gap-1.5 justify-center">
            {row.map((k) => {
              const isPressed = activeKeyCode === k.code;
              return (
                <button
                  key={k.label}
                  disabled={!clavier.estBranche}
                  onClick={() => triggerKey(k.label, k.code)}
                  className={`rounded font-mono font-medium transition-all shadow ${
                    isPressed
                      ? 'bg-emerald-400 text-stone-950 translate-y-0.5 font-bold shadow-none'
                      : k.isFunction
                      ? k.highlight
                        ? 'min-w-[20px] sm:min-w-[23px] h-6 sm:h-7 px-1 text-[9px] sm:text-[10px] bg-stone-850 hover:bg-stone-800 text-emerald-400 border border-emerald-500/40 active:translate-y-0.5'
                        : 'min-w-[19px] sm:min-w-[22px] h-6 sm:h-7 px-1 text-[9px] sm:text-[10px] bg-stone-900 hover:bg-stone-800 text-stone-400 border border-stone-800 active:translate-y-0.5'
                      : k.wide
                      ? 'flex-1 max-w-[85px] h-7 sm:h-8 py-1 px-1 sm:px-2 text-[10px] sm:text-xs bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 active:translate-y-0.5'
                      : 'w-7 sm:w-8 h-7 sm:h-8 px-1 py-1 text-[11px] sm:text-xs bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 hover:border-stone-700 active:translate-y-0.5'
                  } disabled:opacity-30 disabled:pointer-events-none`}
                >
                  {k.label}
                </button>
              );
            })}
          </div>
        ))}

        {/* Barre d'Espace épurée */}
        <div className="flex justify-center pt-0.5">
          <button
            disabled={!clavier.estBranche}
            onClick={() => triggerKey('ESPACE', 32)}
            className={`w-48 sm:w-64 py-1.5 rounded text-xs font-mono font-semibold transition-all shadow ${
              activeKeyCode === 32
                ? 'bg-emerald-400 text-stone-950 font-bold translate-y-0.5'
                : 'bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 active:translate-y-0.5'
            } disabled:opacity-30 disabled:pointer-events-none`}
          >
            ESPACE
          </button>
        </div>
      </div>
    </div>
  );
};
