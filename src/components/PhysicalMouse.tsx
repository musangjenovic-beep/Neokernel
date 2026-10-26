import React, { useRef, useState } from 'react';
import { OrdinateurVirtuel } from '../hardware/computer';
import { Mouse, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface PhysicalMouseProps {
  computer: OrdinateurVirtuel;
  onRefresh: () => void;
}

/**
 * Souris Physique USB (Port USB 2)
 * Interface épurée avec grand tapis tactile, clics direct et ajustement précis
 */
export const PhysicalMouse: React.FC<PhysicalMouseProps> = ({ computer, onRefresh }) => {
  const padRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const souris = computer.souris;

  const updatePosition = (clientX: number, clientY: number, triggerClick?: boolean) => {
    if (!padRef.current || !souris.estBranche) return;
    const rect = padRef.current.getBoundingClientRect();
    const ratioX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const ratioY = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

    const nx = Math.floor(ratioX * souris.maxX);
    const ny = Math.floor(ratioY * souris.maxY);

    souris.deplacerVers(nx, ny);
    computer.os.gererDeplacementSouris(nx, ny, isDragging);

    if (triggerClick) {
      computer.os.gererClicSouris(nx, ny);
    }
    onRefresh();
  };

  const handlePadMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    updatePosition(e.clientX, e.clientY);
  };

  const handlePadMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    computer.audio.jouerSonClicSouris(e.button === 2);
    souris.definirBoutons(e.button === 0, e.button === 2);
    updatePosition(e.clientX, e.clientY, true);
  };

  const handlePadMouseUp = () => {
    setIsDragging(false);
    souris.definirBoutons(false, false);
    onRefresh();
  };

  const stepMove = (dx: number, dy: number) => {
    if (!souris.estBranche) return;
    const nx = Math.max(0, Math.min(souris.maxX - 1, souris.x + dx));
    const ny = Math.max(0, Math.min(souris.maxY - 1, souris.y + dy));
    souris.deplacerVers(nx, ny);
    computer.os.gererDeplacementSouris(nx, ny, false);
    onRefresh();
  };

  const handleLeftClick = () => {
    if (!souris.estBranche) return;
    computer.audio.jouerSonClicSouris(false);
    souris.definirBoutons(true, false);
    computer.os.gererClicSouris(souris.x, souris.y);
    onRefresh();
    setTimeout(() => {
      souris.definirBoutons(false, false);
      onRefresh();
    }, 120);
  };

  const handleRightClick = () => {
    if (!souris.estBranche) return;
    computer.audio.jouerSonClicSouris(true);
    souris.definirBoutons(false, true);
    computer.os.gererClicSouris(souris.x, souris.y);
    onRefresh();
    setTimeout(() => {
      souris.definirBoutons(false, false);
      onRefresh();
    }, 120);
  };

  return (
    <div className="w-full h-full bg-stone-900 border-2 border-stone-800 rounded-xl p-3 shadow-xl text-xs font-mono select-none flex flex-col justify-between">
      {/* En-tête minimaliste : Statut & Coordonnées */}
      <div className="flex items-center justify-between gap-2 mb-2 px-1">
        <div className="flex items-center gap-1.5 text-stone-200">
          <Mouse className="w-4 h-4 text-cyan-400" />
          <span className="font-bold tracking-wider">SOURIS</span>
          <span
            className={`w-2 h-2 rounded-full ${
              souris.estBranche ? 'bg-cyan-400' : 'bg-rose-500'
            }`}
          />
        </div>

        <div className="text-[11px] text-stone-400 font-mono">
          <span className="text-stone-500">X:</span>
          <strong className="text-white ml-0.5 mr-2">{souris.x}</strong>
          <span className="text-stone-500">Y:</span>
          <strong className="text-white ml-0.5">{souris.y}</strong>
        </div>
      </div>

      {/* Grand Tapis Tactile spacieux sans texte inutile */}
      <div
        ref={padRef}
        onMouseMove={handlePadMouseMove}
        onMouseDown={handlePadMouseDown}
        onMouseUp={handlePadMouseUp}
        onContextMenu={(e) => e.preventDefault()}
        className={`w-full flex-1 min-h-[140px] bg-stone-950 border-2 rounded-lg relative overflow-hidden cursor-crosshair transition-colors ${
          souris.estBranche
            ? 'border-cyan-500/30 hover:border-cyan-500/60 shadow-inner'
            : 'border-stone-800 opacity-40 pointer-events-none'
        }`}
      >
        {/* Grille discrète de fond pour repère spatial */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(6,182,212,0.6) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        {/* Pointeur du curseur optique */}
        <div
          className="absolute w-4 h-4 border-2 border-cyan-400 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2 shadow-[0_0_10px_rgba(6,182,212,0.9)] bg-cyan-400/20"
          style={{
            left: `${(souris.x / souris.maxX) * 100}%`,
            top: `${(souris.y / souris.maxY) * 100}%`,
          }}
        />
      </div>

      {/* Boutons et navigation épurés */}
      <div className="mt-2.5 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            disabled={!souris.estBranche}
            onClick={handleLeftClick}
            className={`py-2 px-3 rounded-lg border text-center font-bold text-xs transition-all shadow ${
              souris.clicGauche
                ? 'bg-cyan-400 text-stone-950 border-cyan-300 translate-y-0.5'
                : 'bg-stone-950 hover:bg-stone-800 border-stone-800 hover:border-stone-700 text-stone-200 active:translate-y-0.5'
            } disabled:opacity-30`}
          >
            CLIC GAUCHE
          </button>

          <button
            disabled={!souris.estBranche}
            onClick={handleRightClick}
            className={`py-2 px-3 rounded-lg border text-center font-bold text-xs transition-all shadow ${
              souris.clicDroit
                ? 'bg-cyan-400 text-stone-950 border-cyan-300 translate-y-0.5'
                : 'bg-stone-950 hover:bg-stone-800 border-stone-800 hover:border-stone-700 text-stone-200 active:translate-y-0.5'
            } disabled:opacity-30`}
          >
            CLIC DROIT
          </button>
        </div>

        {/* Flèches fines de déplacement pas à pas */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-1">
            <button
              onClick={() => stepMove(-5, 0)}
              title="-5px X"
              className="p-1 rounded bg-stone-950 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => stepMove(0, -5)}
              title="-5px Y"
              className="p-1 rounded bg-stone-950 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-white"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => stepMove(0, 5)}
              title="+5px Y"
              className="p-1 rounded bg-stone-950 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-white"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => stepMove(5, 0)}
              title="+5px X"
              className="p-1 rounded bg-stone-950 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-white"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-[10px] text-stone-500 font-mono">
            HID: <span className="text-cyan-300">{souris.dernierPaquet?.octetBoutons || '0b00000000'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
