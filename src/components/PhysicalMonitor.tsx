import React, { useEffect, useRef, useState } from 'react';
import { OrdinateurVirtuel } from '../hardware/computer';
import { Power, Sparkles, SlidersHorizontal, Volume2, VolumeX, Eye } from 'lucide-react';
import { PhosphorTheme } from '../hardware/monitor';

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
    moniteur.isPowered = !moniteur.isPowered;
    if (moniteur.isPowered) {
      computer.audio.jouerBip(150, 0.04, 'sine');
    }
    moniteur.render();
    onRefresh();
  };

  const handleDegauss = () => {
    computer.declencherDegauss(onRefresh);
  };

  const handleToggleScanlines = () => {
    computer.scanlinesActives = !computer.scanlinesActives;
    computer.audio.jouerSonTouche();
    onRefresh();
  };

  const handleCyclePhosphor = () => {
    computer.audio.jouerSonTouche();
    if (moniteur.modeCouleur === 'couleur_binaire') {
      moniteur.modeCouleur = 'monochrome';
      moniteur.theme = 'green';
    } else if (moniteur.theme === 'green') {
      moniteur.theme = 'amber';
    } else if (moniteur.theme === 'amber') {
      moniteur.theme = 'white';
    } else {
      moniteur.modeCouleur = 'couleur_binaire';
    }
    moniteur.render();
    onRefresh();
  };

  const handleToggleAudio = () => {
    computer.audio.estMuet = !computer.audio.estMuet;
    if (!computer.audio.estMuet) {
      computer.audio.jouerBip(520, 0.05, 'sine');
    }
    onRefresh();
  };

  const getPhosphorLabel = () => {
    if (moniteur.modeCouleur === 'couleur_binaire') return 'RGB';
    if (moniteur.theme === 'green') return 'P1 VERT';
    if (moniteur.theme === 'amber') return 'P3 AMBRE';
    return 'P4 BLANC';
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

          {/* Commandes CRT physiques : Démagnétiseur, Palette Phosphore, Scanlines, Son, Power */}
          <div className="flex items-center gap-1.5">
            {/* Bouton Démagnétisation (Degauss) */}
            <button
              onClick={handleDegauss}
              disabled={!moniteur.isPowered || !computer.estAllume}
              title="Démagnétisation de l'écran CRT (Degauss coil 50Hz)"
              className="flex items-center gap-1 px-2 py-1 rounded bg-stone-950 hover:bg-stone-800 text-stone-300 hover:text-cyan-300 border border-stone-800 hover:border-cyan-500/50 text-[10px] font-bold active:translate-y-0.5 disabled:opacity-30"
            >
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>DÉMAG</span>
            </button>

            {/* Sélecteur de Phosphore */}
            <button
              onClick={handleCyclePhosphor}
              disabled={!moniteur.isPowered || !computer.estAllume}
              title="Changer le mode phosphore (RGB, Vert P1, Ambre P3, Blanc P4)"
              className="flex items-center gap-1 px-2 py-1 rounded bg-stone-950 hover:bg-stone-800 text-stone-300 hover:text-emerald-300 border border-stone-800 text-[10px] font-bold active:translate-y-0.5 disabled:opacity-30"
            >
              <SlidersHorizontal className="w-3 h-3 text-emerald-400" />
              <span>{getPhosphorLabel()}</span>
            </button>

            {/* Bouton Lignes de Balayage (Scanlines) */}
            <button
              onClick={handleToggleScanlines}
              disabled={!moniteur.isPowered || !computer.estAllume}
              title="Activer/Désactiver les lignes de balayage cathodique"
              className={`flex items-center gap-1 px-2 py-1 rounded border text-[10px] font-bold active:translate-y-0.5 disabled:opacity-30 ${
                computer.scanlinesActives
                  ? 'bg-stone-800 text-emerald-300 border-emerald-500/40'
                  : 'bg-stone-950 text-stone-500 border-stone-800 hover:text-stone-300'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>SCAN</span>
            </button>

            {/* Bouton Haut-Parleur Audio */}
            <button
              onClick={handleToggleAudio}
              title={computer.audio.estMuet ? 'Activer le son' : 'Couper le son'}
              className={`p-1.5 rounded border transition-colors ${
                !computer.audio.estMuet
                  ? 'bg-stone-950 hover:bg-stone-800 text-stone-300 hover:text-white border-stone-800'
                  : 'bg-rose-950/40 text-rose-400 border-rose-900/50'
              }`}
            >
              {computer.audio.estMuet ? (
                <VolumeX className="w-3.5 h-3.5" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Interrupteur Alimentation Écran */}
            <button
              onClick={handleTogglePower}
              title={moniteur.isPowered ? "Éteindre l'écran" : "Allumer l'écran"}
              className={`p-1.5 rounded-md border transition-colors ml-1 ${
                moniteur.isPowered
                  ? 'bg-stone-800 text-emerald-400 border-stone-700 hover:bg-stone-700'
                  : 'bg-stone-950 text-stone-600 border-stone-800 hover:text-stone-400'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
