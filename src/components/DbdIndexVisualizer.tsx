import React, { useState } from 'react';
import { VirtualMemory, DBD_BASE_ADDR, DBD_HEADER_MAGIC } from '../core/memory';
import { DbdEntry } from '../types/virtualComputer';
import { Database, Search, PlusCircle, Network, Layers, CheckCircle2, XCircle } from 'lucide-react';

interface DbdIndexVisualizerProps {
  memory: VirtualMemory;
  onRefresh?: () => void;
}

export const DbdIndexVisualizer: React.FC<DbdIndexVisualizerProps> = ({
  memory,
  onRefresh,
}) => {
  const [searchKey, setSearchKey] = useState<string>('310');
  const [searchTrace, setSearchTrace] = useState<{
    found: boolean;
    recordPointer: number;
    steps: { nodeIdx: number; key: number; action: string; ramAddr: number }[];
    recordValue?: number;
  } | null>(null);

  const [insertKey, setInsertKey] = useState<string>('350');
  const [insertPtr, setInsertPtr] = useState<string>('0x02A0');
  const [insertMsg, setInsertMsg] = useState<string | null>(null);

  const entries = memory.getDbdEntries();
  const rootIdx = memory.ram[DBD_BASE_ADDR + 3];
  const count = memory.ram[DBD_BASE_ADDR + 1];
  const capacity = memory.ram[DBD_BASE_ADDR + 2];
  const magic = memory.ram[DBD_BASE_ADDR] & 0xffff;

  // Run interactive traversal trace
  const handleSearch = () => {
    const k = parseInt(searchKey, 10);
    if (isNaN(k)) return;

    const traceSteps: { nodeIdx: number; key: number; action: string; ramAddr: number }[] = [];
    let currentIdx = rootIdx;
    let found = false;
    let recPtr = -1;

    while (currentIdx >= 0 && currentIdx < capacity) {
      const curAddr = DBD_BASE_ADDR + 4 + currentIdx * 4;
      const curKey = memory.ram[curAddr + 0];
      const curPtr = memory.ram[curAddr + 1];
      const left = memory.ram[curAddr + 2];
      const right = memory.ram[curAddr + 3];

      if (k === curKey) {
        traceSteps.push({
          nodeIdx: currentIdx,
          key: curKey,
          action: `Correspondance exacte trouvée ! Pointeur = 0x${curPtr.toString(16).toUpperCase()}`,
          ramAddr: curAddr,
        });
        found = true;
        recPtr = curPtr;
        break;
      } else if (k < curKey) {
        traceSteps.push({
          nodeIdx: currentIdx,
          key: curKey,
          action: `Clé cible (${k}) < Clé nœud (${curKey}) -> Descente branche GAUCHE (nœud #${left})`,
          ramAddr: curAddr,
        });
        currentIdx = left;
      } else {
        traceSteps.push({
          nodeIdx: currentIdx,
          key: curKey,
          action: `Clé cible (${k}) > Clé nœud (${curKey}) -> Descente branche DROITE (nœud #${right})`,
          ramAddr: curAddr,
        });
        currentIdx = right;
      }
    }

    let recValue: number | undefined;
    if (found && recPtr >= 0 && recPtr < 1024) {
      recValue = memory.read(recPtr);
    }

    setSearchTrace({
      found,
      recordPointer: recPtr,
      steps: traceSteps,
      recordValue: recValue,
    });
  };

  const handleInsert = () => {
    const k = parseInt(insertKey, 10);
    let p = 0;
    if (insertPtr.startsWith('0x') || insertPtr.startsWith('0X')) {
      p = parseInt(insertPtr.substring(2), 16);
    } else {
      p = parseInt(insertPtr, 10);
    }

    if (isNaN(k) || isNaN(p)) return;

    const ok = memory.dbdInsert(k, p);
    if (ok) {
      setInsertMsg(`Clé ${k} insérée avec succès dans l'Index RAM (Ptr: 0x${p.toString(16).toUpperCase()})`);
      if (onRefresh) onRefresh();
    } else {
      setInsertMsg(`Erreur : Capacité maximale atteinte (${capacity} nœuds)`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Overview & Architecture Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-slate-200">
              Index DBD en Mémoire Vive (Structure Arborescente Optimisée dans la RAM)
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>Adresse Base: <strong className="text-amber-400">0x01C0</strong></span>
            <span>·</span>
            <span>Signature Magic: <strong className="text-slate-200">0x{magic.toString(16).toUpperCase()}</strong></span>
            <span>·</span>
            <span>Nœuds: <strong className="text-white">{count} / {capacity}</strong></span>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Pour satisfaire l'accès haute performance aux données sans système de fichiers complexe, 
          l'ordinateur réserve la plage mémoire <strong>0x01C0 à 0x027F</strong> pour héberger un 
          <strong> index arborescent B-Tree binaire directement dans les mots de la RAM</strong>. 
          Chaque entrée occupe 4 mots consécutifs en mémoire : <code className="text-amber-300">[Clé, Pointeur Donnée, Fils Gauche, Fils Droit]</code>.
        </p>

        {/* Header Words Status */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-800 text-xs font-mono">
          <div className="p-2 bg-slate-950/70 border border-slate-800 rounded">
            <div className="text-[10px] text-slate-500">RAM[0x01C0] MAGIC</div>
            <div className="font-semibold text-amber-300">0x{magic.toString(16).toUpperCase()}</div>
          </div>
          <div className="p-2 bg-slate-950/70 border border-slate-800 rounded">
            <div className="text-[10px] text-slate-500">RAM[0x01C1] COUNT</div>
            <div className="font-semibold text-white">{count} entrées</div>
          </div>
          <div className="p-2 bg-slate-950/70 border border-slate-800 rounded">
            <div className="text-[10px] text-slate-500">RAM[0x01C2] CAPACITY</div>
            <div className="font-semibold text-slate-300">{capacity} nœuds max</div>
          </div>
          <div className="p-2 bg-slate-950/70 border border-slate-800 rounded">
            <div className="text-[10px] text-slate-500">RAM[0x01C3] ROOT_INDEX</div>
            <div className="font-semibold text-cyan-300">
              {rootIdx === -1 ? 'Vide (-1)' : `Nœud #${rootIdx}`}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Search & Insert Simulator + Memory Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (5 cols): Interactive Query & Insert */}
        <div className="lg:col-span-5 space-y-4">
          {/* Query Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-semibold text-slate-200">
                Testeur de Requête Haute Vitesse O(log N)
              </span>
            </div>

            <div className="flex gap-2 mb-3">
              <input
                type="number"
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
                placeholder="Entrez clé (ex: 310)"
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded px-3 py-1.5 text-xs text-white font-mono outline-none"
              />
              <button
                onClick={handleSearch}
                className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded text-xs transition-colors shrink-0"
              >
                Rechercher
              </button>
            </div>

            {/* Trace result */}
            {searchTrace && (
              <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-lg text-xs space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    {searchTrace.found ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    )}
                    {searchTrace.found ? 'Clé Trouvée dans l\'Index' : 'Clé Absente'}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Étapes: <strong className="text-cyan-400">{searchTrace.steps.length}</strong>
                  </span>
                </div>

                {/* Steps walkthrough */}
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {searchTrace.steps.map((st, i) => (
                    <div key={i} className="text-[11px] font-mono text-slate-300 bg-slate-900/80 p-1.5 rounded border border-slate-800/80">
                      <div className="text-slate-400 text-[10px]">
                        Étape {i + 1} · RAM[0x{st.ramAddr.toString(16).toUpperCase()}] (Nœud #{st.nodeIdx})
                      </div>
                      <div className="text-slate-200 mt-0.5">{st.action}</div>
                    </div>
                  ))}
                </div>

                {searchTrace.found && (
                  <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between items-center font-mono text-[11px]">
                    <span className="text-slate-400">Pointeur Enregistrement:</span>
                    <span className="text-amber-400 font-bold">
                      0x{searchTrace.recordPointer.toString(16).toUpperCase()}
                    </span>
                    {searchTrace.recordValue !== undefined && (
                      <span className="text-emerald-400 font-bold">
                        (Valeur: {searchTrace.recordValue})
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Insert Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-slate-200">
                Insertion Manuelle de Nœud dans l'Index RAM
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Clé Entière (16-bit)</label>
                <input
                  type="number"
                  value={insertKey}
                  onChange={(e) => setInsertKey(e.target.value)}
                  placeholder="350"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded px-2.5 py-1.5 text-xs text-white font-mono outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Pointeur Donnée (Hex/Dec)</label>
                <input
                  type="text"
                  value={insertPtr}
                  onChange={(e) => setInsertPtr(e.target.value)}
                  placeholder="0x02A0"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded px-2.5 py-1.5 text-xs text-white font-mono outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleInsert}
              className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded text-xs transition-colors"
            >
              Insérer dans l'Index B-Tree
            </button>

            {insertMsg && (
              <div className="mt-2 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                {insertMsg}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (7 cols): Visual Nodes Table in RAM */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5 text-amber-400" />
              Table des Nœuds Mappés en RAM (0x01C4..0x027F)
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Format: [Key, Ptr, Left, Right]
            </span>
          </div>

          {entries.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/60 border border-slate-800 rounded-lg text-slate-500 text-xs">
              L'index DBD en mémoire vive est actuellement vide. Lancez le preset <strong>"Moteur Index DBD"</strong> ou insérez une clé manuellement ci-contre.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] text-slate-400">
                    <th className="py-2 px-2.5">ID</th>
                    <th className="py-2 px-2.5">Adresse RAM</th>
                    <th className="py-2 px-2.5 text-amber-300">Clé (Key)</th>
                    <th className="py-2 px-2.5 text-indigo-300">Pointeur Record</th>
                    <th className="py-2 px-2.5">Fils G.</th>
                    <th className="py-2 px-2.5">Fils D.</th>
                    <th className="py-2 px-2.5">Rôle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {entries.map((entry) => {
                    const isRoot = entry.index === rootIdx;
                    return (
                      <tr
                        key={entry.index}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          isRoot ? 'bg-amber-500/10' : ''
                        }`}
                      >
                        <td className="py-2 px-2.5 font-bold text-slate-300">#{entry.index}</td>
                        <td className="py-2 px-2.5 text-slate-400">
                          0x{entry.ramAddress.toString(16).toUpperCase()}
                        </td>
                        <td className="py-2 px-2.5 font-bold text-amber-300 tabular-nums">
                          {entry.key}
                        </td>
                        <td className="py-2 px-2.5 text-indigo-300 tabular-nums">
                          0x{entry.recordPointer.toString(16).toUpperCase()}
                        </td>
                        <td className="py-2 px-2.5 text-slate-400 tabular-nums">
                          {entry.leftChild === -1 ? '—' : `#${entry.leftChild}`}
                        </td>
                        <td className="py-2 px-2.5 text-slate-400 tabular-nums">
                          {entry.rightChild === -1 ? '—' : `#${entry.rightChild}`}
                        </td>
                        <td className="py-2 px-2.5">
                          {isRoot ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Racine
                            </span>
                          ) : entry.leftChild === -1 && entry.rightChild === -1 ? (
                            <span className="text-[10px] text-slate-400">Feuille</span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Branche</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
