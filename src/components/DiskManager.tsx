import React, { useState } from 'react';
import { DiskStorage } from '../core/cpu';
import { Save, HardDrive, Download, Upload, RefreshCw, CheckCircle2 } from 'lucide-react';

interface DiskManagerProps {
  disk: DiskStorage;
  onFormatDisk: () => void;
  onReadSectorToRam: (sector: number, ramAddr: number) => void;
  onWriteRamToSector: (sector: number, ramAddr: number) => void;
  irq2Pending: boolean;
}

export const DiskManager: React.FC<DiskManagerProps> = ({
  disk,
  onFormatDisk,
  onReadSectorToRam,
  onWriteRamToSector,
  irq2Pending,
}) => {
  const [selectedSector, setSelectedSector] = useState<number>(0);
  const [targetRamAddr, setTargetRamAddr] = useState<string>('0x0280');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const sectorData = disk.sectors[selectedSector] || new Array(64).fill(0);

  const parseRamAddr = (str: string) => {
    if (str.startsWith('0x') || str.startsWith('0X')) {
      return parseInt(str.substring(2), 16) || 0;
    }
    return parseInt(str, 10) || 0;
  };

  const handleRead = () => {
    const addr = parseRamAddr(targetRamAddr);
    onReadSectorToRam(selectedSector, addr);
    setActionNotice(`Secteur #${selectedSector} transféré vers la RAM à l'adresse 0x${addr.toString(16).toUpperCase()} (IRQ2 Déclenché)`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleWrite = () => {
    const addr = parseRamAddr(targetRamAddr);
    onWriteRamToSector(selectedSector, addr);
    setActionNotice(`64 mots copiés de la RAM (0x${addr.toString(16).toUpperCase()}) vers le Secteur Disque #${selectedSector}`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleExportDisk = () => {
    const blob = new Blob([JSON.stringify(disk, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `virtuarch_virtual_disk_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportDisk = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.sectors && Array.isArray(parsed.sectors)) {
          for (let i = 0; i < 8; i++) {
            if (parsed.sectors[i]) {
              disk.sectors[i] = [...parsed.sectors[i]];
            }
          }
          setActionNotice('Image disque virtuel restaurée avec succès !');
          setTimeout(() => setActionNotice(null), 3500);
        }
      } catch (err) {
        alert('Fichier d\'image disque invalide');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-200">
            Stockage Virtuel Intégré (Disque Dur à Secteurs & Contrôleur E/S)
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400 text-[11px]">Ligne IRQ2:</span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
              irq2Pending
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500'
                : 'bg-slate-950 text-slate-500 border-slate-800'
            }`}
          >
            {irq2Pending ? 'DISQUE PRÊT (IRQ2)' : 'REPOS'}
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed">
        Ce périphérique matériel simule un disque magnétique à <strong>8 secteurs de 64 mots (512 mots non-volatils au total)</strong>. 
        Le processeur peut y charger ou persister du code et des enregistrements DBD via les instructions bas-niveau <code className="text-cyan-300">DISK_READ</code> et <code className="text-cyan-300">DISK_WRITE</code>.
      </p>

      {/* Sector Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 text-[11px] whitespace-nowrap">Secteur Actif :</span>
        {Array.from({ length: 8 }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedSector(idx)}
            className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
              selectedSector === idx
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Secteur #{idx}
          </button>
        ))}
      </div>

      {/* DMA / I/O Transfer Controls */}
      <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-[11px]">Adresse Cible RAM :</span>
          <input
            type="text"
            value={targetRamAddr}
            onChange={(e) => setTargetRamAddr(e.target.value)}
            className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-cyan-300 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRead}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-medium transition-colors"
          >
            Lire Secteur vers RAM (DISK_READ)
          </button>
          <button
            onClick={handleWrite}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-medium transition-colors"
          >
            Écrire RAM vers Secteur (DISK_WRITE)
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded text-indigo-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Sector Data Hex Grid */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-3 font-mono text-xs max-h-56 overflow-y-auto">
        <div className="text-[10px] text-slate-500 mb-2 flex justify-between">
          <span>Contenu du Secteur #{selectedSector} (64 mots) :</span>
          <span>Valeurs entières / Pointeurs</span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 text-center">
          {sectorData.map((val, idx) => (
            <div
              key={idx}
              className={`p-1.5 rounded border text-[11px] tabular-nums ${
                val !== 0
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300 font-semibold'
                  : 'bg-slate-900/60 border-slate-800/80 text-slate-600'
              }`}
            >
              <div className="text-[9px] text-slate-500">+{idx}</div>
              <div>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Disk Backup and Reset Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportDisk}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors text-[11px]"
          >
            <Download className="w-3 h-3" />
            <span>Sauvegarder Image Disque (.json)</span>
          </button>

          <label className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 cursor-pointer transition-colors text-[11px]">
            <Upload className="w-3 h-3" />
            <span>Charger Image Disque</span>
            <input type="file" accept=".json" onChange={handleImportDisk} className="hidden" />
          </label>
        </div>

        <button
          onClick={onFormatDisk}
          className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded text-[11px] transition-colors"
        >
          Formater le Disque (Remise à Zéro)
        </button>
      </div>
    </div>
  );
};
