import React, { useEffect, useRef, useState } from 'react';
import { COLOR_PALETTE, SCREEN_HEIGHT, SCREEN_WIDTH } from '../core/cpu';
import { Monitor, RefreshCw, ZoomIn, Eye, Sparkles } from 'lucide-react';

interface VirtualScreenProps {
  screenBuffer: Uint8Array;
  isRunning: boolean;
  tick?: number;
  onClearScreen?: (color: number) => void;
  onDrawPixelTest?: (x: number, y: number, color: number) => void;
}

const CANVAS_RES = 384; // High-resolution internal canvas (12 native px per virtual pixel)
const PIXEL_SCALE = CANVAS_RES / SCREEN_WIDTH; // 12

export const VirtualScreen: React.FC<VirtualScreenProps> = ({
  screenBuffer,
  isRunning,
  tick,
  onClearScreen,
  onDrawPixelTest,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [enableScanlines, setEnableScanlines] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [hoveredPixel, setHoveredPixel] = useState<{ x: number; y: number; color: number } | null>(null);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    // Draw 32x32 virtual pixels scaled to 384x384 crisp rectangles
    for (let y = 0; y < SCREEN_HEIGHT; y++) {
      for (let x = 0; x < SCREEN_WIDTH; x++) {
        const colorIdx = screenBuffer[y * SCREEN_WIDTH + x] & 15;
        ctx.fillStyle = COLOR_PALETTE[colorIdx] || '#090d16';
        ctx.fillRect(x * PIXEL_SCALE, y * PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);
      }
    }

    // Optional subtle grid between pixels for authentic retro feel
    if (showGrid) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= SCREEN_WIDTH; i++) {
        ctx.beginPath();
        ctx.moveTo(i * PIXEL_SCALE, 0);
        ctx.lineTo(i * PIXEL_SCALE, CANVAS_RES);
        ctx.stroke();
      }
      for (let j = 0; j <= SCREEN_HEIGHT; j++) {
        ctx.beginPath();
        ctx.moveTo(0, j * PIXEL_SCALE);
        ctx.lineTo(CANVAS_RES, j * PIXEL_SCALE);
        ctx.stroke();
      }
    }
  };

  // Immediate redraw on mount, tick, or buffer change
  useEffect(() => {
    drawCanvas();
  }, [screenBuffer, tick, showGrid]);

  // When isRunning is active, render every frame
  useEffect(() => {
    drawCanvas();
    if (!isRunning) return;

    let animId: number;
    const loop = () => {
      drawCanvas();
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isRunning, screenBuffer, showGrid]);

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scale = SCREEN_WIDTH / rect.width;

    const x = Math.floor((e.clientX - rect.left) * scale);
    const y = Math.floor((e.clientY - rect.top) * scale);

    if (x >= 0 && x < SCREEN_WIDTH && y >= 0 && y < SCREEN_HEIGHT) {
      const color = screenBuffer[y * SCREEN_WIDTH + x] & 15;
      setHoveredPixel({ x, y, color });
    }
  };

  const handleCanvasMouseLeave = () => {
    setHoveredPixel(null);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!hoveredPixel || !onDrawPixelTest) return;
    onDrawPixelTest(hoveredPixel.x, hoveredPixel.y, 11); // Green pixel test
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Retro Monitor Chassis */}
      <div className="w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-2xl relative">
        {/* Top Bezel: Brand Wordmark & Ventilation Grille */}
        <div className="flex items-center justify-between mb-3 px-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono tracking-widest font-bold text-slate-400">
              VIRTUARCH · CRT DISPLAY 32×32
            </span>
          </div>

          {/* Monitor Status LED & Controls */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors border ${
                showGrid
                  ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
            >
              Grille
            </button>

            <button
              onClick={() => setEnableScanlines(!enableScanlines)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors border ${
                enableScanlines
                  ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
            >
              Scanlines
            </button>

            {/* Power Indicator Light */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
              <span
                className={`w-2 h-2 rounded-full transition-colors ${
                  isRunning
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                    : 'bg-cyan-400/80 shadow-[0_0_6px_rgba(6,182,212,0.6)]'
                }`}
              />
              <span className="text-[10px] font-mono text-slate-400">
                {isRunning ? 'ACTIF' : 'PRÊT'}
              </span>
            </div>
          </div>
        </div>

        {/* Cathode Ray Tube Inner Bezel */}
        <div className="p-3 sm:p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
          <div
            className={`relative rounded-lg overflow-hidden border-2 border-slate-800 shadow-2xl transition-all ${
              enableScanlines ? 'crt-monitor' : ''
            }`}
          >
            <canvas
              ref={canvasRef}
              width={CANVAS_RES}
              height={CANVAS_RES}
              onMouseMove={handleCanvasMouseMove}
              onMouseLeave={handleCanvasMouseLeave}
              onClick={handleCanvasClick}
              className="cursor-crosshair block shadow-inner w-[280px] h-[280px] sm:w-[350px] sm:h-[350px] max-w-full aspect-square"
            />
          </div>

          {/* CRT Bottom Bezel: Live Telemetry */}
          <div className="mt-2.5 flex items-center justify-between w-full max-w-sm text-[11px] font-mono text-slate-400 px-1">
            <div>
              {hoveredPixel ? (
                <span>
                  Pixel: X=<strong className="text-cyan-400">{hoveredPixel.x}</strong>, Y=
                  <strong className="text-cyan-400">{hoveredPixel.y}</strong>
                </span>
              ) : (
                <span className="text-slate-500">32×32 Pixels · 16 Couleurs CGA</span>
              )}
            </div>

            <div>
              {hoveredPixel ? (
                <span className="flex items-center gap-1.5">
                  Couleur: <strong className="text-white">{hoveredPixel.color}</strong>
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block border border-slate-600"
                    style={{ backgroundColor: COLOR_PALETTE[hoveredPixel.color] }}
                  />
                </span>
              ) : (
                <button
                  onClick={() => onClearScreen && onClearScreen(0)}
                  title="Effacer l'écran en noir"
                  className="text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  <span>Effacer</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
