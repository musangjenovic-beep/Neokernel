import React, { useState } from 'react';
import { VirtualMemory, MEMORY_SEGMENTS, RAM_SIZE } from '../core/memory';
import { HardDrive, Search, ArrowRight, Edit3 } from 'lucide-react';

interface MemoryViewerProps {
  memory: VirtualMemory;
  currentPC: number;
  currentSP: number;
  onWriteCell?: (address: number, val: number) => void;
}

export const MemoryViewer: React.FC<MemoryViewerProps> = ({
  memory,
  currentPC,
  currentSP,
  onWriteCell,
}) => {
  const [selectedSegment, setSelectedSegment] = useState<number>(0);
  const [displayFormat, setDisplayFormat] = useState<'HEX' | 'DEC'>('HEX');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingAddr, setEditingAddr] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const seg = MEMORY_SEGMENTS[selectedSegment] || MEMORY_SEGMENTS[0];
  const wordsPerRow = 8;

  // Filter or chunk words for current segment
  const rows: { addr: number; words: number[] }[] = [];
  for (let a = seg.start; a <= seg.end; a += wordsPerRow) {
    const words: number[] = [];
    for (let offset = 0; offset < wordsPerRow; offset++) {
      if (a + offset <= seg.end) {
        words.push(memory.read(a + offset));
      }
    }
    rows.push({ addr: a, words });
  }

  const formatWord = (w: number) => {
    if (displayFormat === 'HEX') {
      const u = (w >>> 0) & 0xffff;
      return '0x' + u.toString(16).toUpperCase().padStart(4, '0');
    }
    return w.toString(10);
  };

  const handleCellClick = (addr: number, currentVal: number) => {
    setEditingAddr(addr);
    setEditValue(currentVal.toString());
  };

  const handleCellSave = (addr: number) => {
    if (!onWriteCell) return;
    let v = 0;
    if (editValue.startsWith('0x') || editValue.startsWith('0X')) {
      v = parseInt(editValue.substring(2), 16);
    } else {
      v = parseInt(editValue, 10);
    }
    if (!isNaN(v)) {
      onWriteCell(addr, v);
    }
    setEditingAddr(null);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col h-full space-y-3">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-200">
            Inspecteur de Mémoire Vive RAM (1024 mots de 16-bit)
          </span>
        </div>

        {/* Display Format Toggle */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center p-0.5 bg-slate-950 rounded border border-slate-800">
            <button
              onClick={() => setDisplayFormat('HEX')}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                displayFormat === 'HEX' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
              }`}
            >
              HEX
            </button>
            <button
              onClick={() => setDisplayFormat('DEC')}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                displayFormat === 'DEC' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
              }`}
            >
              DEC
            </button>
          </div>
        </div>
      </div>

      {/* Segment Selector Tabs */}
      <div className="flex flex-wrap gap-1.5 pb-1">
        {MEMORY_SEGMENTS.map((s, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedSegment(idx)}
            className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
              selectedSegment === idx
                ? 'bg-slate-800 border-cyan-500/50 text-white font-semibold'
                : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {s.name} (0x{s.start.toString(16).toUpperCase()} - 0x{s.end.toString(16).toUpperCase()})
          </button>
        ))}
      </div>

      {/* Segment Description */}
      <div className="p-2 bg-slate-950/80 border border-slate-800/80 rounded text-[11px] text-slate-300">
        <strong className="text-cyan-400 font-mono">0x{seg.start.toString(16).toUpperCase()}..0x{seg.end.toString(16).toUpperCase()}:</strong> {seg.description}
      </div>

      {/* Hex Grid Table */}
      <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[380px] bg-slate-950/90 border border-slate-800 rounded-lg p-2 font-mono text-xs">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-800/80 text-[10px] text-slate-500">
              <th className="py-1 px-2 w-20">Adresse</th>
              {Array.from({ length: wordsPerRow }).map((_, i) => (
                <th key={i} className="py-1 px-1.5 text-center">
                  +{i.toString(16).toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {rows.map((row) => (
              <tr key={row.addr} className="hover:bg-slate-900/60 transition-colors">
                <td className="py-1 px-2 text-slate-500 font-bold text-[11px]">
                  0x{row.addr.toString(16).toUpperCase().padStart(4, '0')}
                </td>
                {row.words.map((w, colIdx) => {
                  const cellAddr = row.addr + colIdx;
                  const isPC = cellAddr === currentPC;
                  const isSP = cellAddr === currentSP;
                  const isEditing = editingAddr === cellAddr;

                  return (
                    <td key={colIdx} className="py-1 px-1.5 text-center">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleCellSave(cellAddr)}
                          onKeyDown={(e) => e.key === 'Enter' && handleCellSave(cellAddr)}
                          autoFocus
                          className="w-16 bg-slate-900 border border-cyan-400 rounded px-1 text-center text-xs text-white outline-none"
                        />
                      ) : (
                        <button
                          onClick={() => handleCellClick(cellAddr, w)}
                          title={`Adresse 0x${cellAddr.toString(16).toUpperCase()} (${cellAddr})\nValeur: ${w}\nCliquez pour modifier`}
                          className={`px-1.5 py-0.5 rounded transition-all tabular-nums text-[11px] ${
                            isPC
                              ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500 ring-1 ring-cyan-500/40'
                              : isSP
                              ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500 ring-1 ring-rose-500/40'
                              : w !== 0
                              ? 'text-slate-100 hover:bg-slate-800'
                              : 'text-slate-600 hover:text-slate-400 hover:bg-slate-800'
                          }`}
                        >
                          {formatWord(w)}
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend & Telemetry */}
      <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-cyan-500/40 border border-cyan-400" />
            <span>Pointeur PC (0x{currentPC.toString(16).toUpperCase()})</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-rose-500/40 border border-rose-400" />
            <span>Sommet Pile SP (0x{currentSP.toString(16).toUpperCase()})</span>
          </span>
        </div>
        <div className="text-slate-500">
          Cliquez sur une cellule pour modifier directement la valeur en RAM
        </div>
      </div>
    </div>
  );
};
