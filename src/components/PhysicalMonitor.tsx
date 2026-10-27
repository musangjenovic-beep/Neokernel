import React, { useEffect, useRef, useState } from 'react';
import { OrdinateurVirtuel } from '../hardware/computer';
import { Power } from 'lucide-react';

interface PhysicalMonitorProps {
  computer: OrdinateurVirtuel;
  onRefresh: () => void;
}

/**
 * Moniteur CRT Rétro Virtuel Haute Fidélité (VirtuArch CRT-330)
 * Intègre les mécanismes physiques authentiques :
 * - Bobine de Démagnétisation (Degauss coil) avec secousse magnétique et flash phosphorescent
 * - Sélecteur de Phosphore Matériel (RGB Binaire, Vert P1, Ambre P3, Blanc P4)
 * - Lignes de Balayage CRT (Scanlines cathodiques)
 * - LED d'activité Disque Dur / FDD réactive en temps réel
 * - Bouton d'alimentation avec bruit de relais
 */
export const PhysicalMonitor: React.FC<PhysicalMonitorProps> = ({ computer, onRefresh }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);

  const moniteur = computer.moniteur;

  useEffect(() => {
    if (canvasRef.current) {
      moniteur.attacherCanvas(canvasRef.current);
      computer.vga.rafraichirSignal();
    }
  }, [moniteur, computer]);

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !computer.souris.estBranche) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = moniteur.cols / rect.width;
    const scaleY = moniteur.rows / rect.height;

    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    computer.os.gererDeplacementSouris(x, y, isMouseDown);
    onRefresh();
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsMouseDown(true);
    computer.audio.jouerSonClicSouris(e.button === 2);
    computer.souris.definirBoutons(e.button === 0, e.button === 2);

    const canvas = canvasRef.current;
    if (!canvas || !computer.souris.estBranche) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = moniteur.cols / rect.width;
    const scaleY = moniteur.rows / rect.height;

    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    computer.os.gererClicSouris(x, y);
    onRefresh();
  };

  const handleCanvasMouseUp = () => {
    setIsMouseDown(false);
    computer.souris.definirBoutons(false, false);
    onRefresh();
  };

  const handleTogglePower = () => {
    if (computer.estAllume) {
      computer.eteindre();
    } else {
      computer.demarrer();
    }
    onRefresh();
  };

  return (
    <div className="w-full flex flex-col items-center select-none">
      {/* Boîtier Châssis Moniteur CRT Rétro */}
      <div className="w-full max-w-4xl bg-stone-900 border-4 border-stone-800 rounded-2xl p-3 sm:p-5 shadow-2xl relative">
        {/* Écran CRT en verre avec cadre intérieur incurvé */}
        <div
          className={`relative w-full rounded-xl overflow-hidden bg-black border-2 border-stone-950 shadow-[inset_0_0_35px_rgba(0,0,0,0.98)] flex items-center justify-center transition-all ${
            computer.degaussEnCours ? 'animate-pulse brightness-150 contrast-125' : ''
          }`}
          style={{
            boxShadow:
              moniteur.isPowered && computer.estAllume
                ? 'inset 0 0 30px rgba(0,0,0,0.9), 0 0 25px rgba(0, 255, 120, 0.05)'
                : 'inset 0 0 40px rgba(0,0,0,1)',
          }}
        >
          {/* Surface Canvas Pixel-Art 330x165 */}
          <canvas
            ref={canvasRef}
            width={330}
            height={165}
            onMouseMove={handleCanvasMouseMove}
            onMouseDown={handleCanvasMouseDown}
            onMouseUp={handleCanvasMouseUp}
            onContextMenu={(e) => e.preventDefault()}
            className={`w-full h-auto aspect-[2/1] cursor-crosshair block transition-transform ${
              computer.degaussEnCours ? 'scale-[1.01]' : 'scale-100'
            }`}
            style={{
              imageRendering: 'pixelated',
            }}
          />

          {/* Lignes de balayage CRT (Scanlines cathodiques) */}
          {computer.scanlinesActives && moniteur.isPowered && computer.estAllume && (
            <div
              className="pointer-events-none absolute inset-0 opacity-40 mix-blend-overlay"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.8) 50%)',
                backgroundSize: '100% 4px',
              }}
            />
          )}

          {/* Effet reflet de verre CRT incurvé */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-black/40" />

          {/* Flash phosphorescent de démagnétisation */}
          {computer.degaussEnCours && (
            <div className="pointer-events-none absolute inset-0 bg-cyan-300/20 mix-blend-screen transition-opacity duration-700" />
          )}
        </div>

        {/* Panneau de contrôle physique sur le châssis inférieur */}
        <div className="flex flex-wrap items-center justify-between mt-3 px-2 gap-2 text-stone-400 font-mono text-xs">
          {/* Marque et LEDs matérielles d'activité */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono tracking-widest text-stone-400 font-bold uppercase">
              VirtuArch CRT-330
            </span>

            {/* LED PWR (Alimentation) */}
            <div className="flex items-center gap-1.5" title="Alimentation Écran">
              <div
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  moniteur.isPowered && computer.estAllume
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]'
                    : 'bg-stone-700'
                }`}
              />
              <span className="text-[9px] text-stone-500 font-bold">PWR</span>
            </div>

            {/* LED HDD / DISQUE (Activité de lecture/écriture) */}
            <div className="flex items-center gap-1.5" title="Activité Mémoire / Disque">
              <div
                className={`w-2 h-2 rounded-full transition-all duration-150 ${
                  computer.disqueEnAcces
                    ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,1)] scale-110'
                    : 'bg-stone-800'
                }`}
              />
              <span
                className={`text-[9px] font-bold ${
                  computer.disqueEnAcces ? 'text-amber-400' : 'text-stone-600'
                }`}
              >
                HDD
              </span>
            </div>
          </div>

          {/* Bouton Unique : Interrupteur d'Alimentation Réel (Power Switch On/Off) */}
          <div className="flex items-center">
            <button
              onClick={handleTogglePower}
              title={
                computer.estAllume
                  ? "Éteindre l'ordinateur virtuel et l'écran (Power Off)"
                  : "Allumer l'ordinateur virtuel et l'écran (Power On)"
              }
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border font-mono text-xs font-bold transition-all shadow-md active:scale-95 ${
                computer.estAllume && moniteur.isPowered
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25 shadow-[0_0_12px_rgba(52,211,153,0.3)]'
                  : 'bg-stone-950 text-stone-500 border-stone-800 hover:text-stone-300 hover:border-stone-700'
              }`}
            >
              <Power
                className={`w-3.5 h-3.5 ${
                  computer.estAllume ? 'text-emerald-400' : 'text-stone-600'
                }`}
              />
              <span>{computer.estAllume ? 'POWER ON' : 'POWER OFF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
