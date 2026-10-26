import React, { useState } from 'react';
import { OrdinateurVirtuel } from '../hardware/computer';
import {
  Code,
  Play,
  Binary,
  Layers,
  Sparkles,
  PlusCircle,
  FileText,
  Volume2,
  Tv,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface LanguageStudioDrawerProps {
  computer: OrdinateurVirtuel;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const LanguageStudioDrawer: React.FC<LanguageStudioDrawerProps> = ({
  computer,
  isOpen,
  onClose,
  onRefresh,
}) => {
  const studio = computer.os.studio;
  const [sourceCode, setSourceCode] = useState<string>(studio.modelesProgrammes[0].code);
  const [appName, setAppName] = useState<string>(studio.modelesProgrammes[0].nom);
  const [selectedTemplate, setSelectedTemplate] = useState<number>(0);
  const [newKeyword, setNewKeyword] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [compileSuccess, setCompileSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSelectTemplate = (idx: number) => {
    setSelectedTemplate(idx);
    const tmpl = studio.modelesProgrammes[idx];
    if (tmpl) {
      setSourceCode(tmpl.code);
      setAppName(tmpl.nom);
    }
  };

  const handleCompile = () => {
    computer.activerAccesDisque(400, 4);
    const prog = computer.os.compilerEtCharger(sourceCode, appName);
    if (prog.succes) {
      setCompileSuccess(true);
      setTimeout(() => setCompileSuccess(false), 2500);
    }
    computer.os.rafraichirBureau();
    onRefresh();
  };

  const handleExecute = () => {
    computer.activerAccesDisque(600, 5);
    handleCompile();
    computer.os.executerApplicationBinaire();
    onClose();
    onRefresh();
  };

  const handleAddRule = () => {
    if (!newKeyword.trim()) return;
    studio.ajouterRegle(newKeyword.trim(), newDesc.trim() || 'Instruction personnalisée');
    setNewKeyword('');
    setNewDesc('');
    onRefresh();
  };

  const compiled = computer.os.derniereAppCompilee;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-stone-900 border-2 border-stone-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-100 font-sans">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Code className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Studio de Création de Langages & d'Applications</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  100% Binaire
                </span>
              </h2>
              <p className="text-[11px] text-stone-400">
                Définissez la syntaxe de votre propre langage, compilez en bytecode binaire et exécutez sur l'OS
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 border border-transparent hover:border-stone-700 text-xs font-mono transition-colors"
          >
            Fermer ✕
          </button>
        </div>

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Grille : Éditeur de Code + Règles du Langage */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Colonne Gauche (7 colonnes) : Éditeur & Modèles */}
            <div className="lg:col-span-7 space-y-3">
              {/* Choix du modèle */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-stone-400 text-[11px]">Modèle d'Application :</span>
                <div className="flex items-center gap-1">
                  {studio.modelesProgrammes.map((tmpl, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectTemplate(idx)}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                        selectedTemplate === idx
                          ? 'bg-emerald-500 text-stone-950 font-bold'
                          : 'bg-stone-950 border border-stone-800 text-stone-400 hover:text-white'
                      }`}
                    >
                      {tmpl.nom}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nom de l'application */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-stone-400 text-[11px]">Nom :</span>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="flex-1 bg-stone-950 border border-stone-800 rounded px-2.5 py-1 font-mono text-emerald-300 outline-none focus:border-emerald-500"
                />
              </div>

              {/* Textarea Code Source */}
              <div className="relative">
                <textarea
                  value={sourceCode}
                  onChange={(e) => setSourceCode(e.target.value)}
                  rows={11}
                  spellCheck={false}
                  className="w-full p-3 bg-stone-950 border border-stone-800 rounded-lg text-xs font-mono text-emerald-300 outline-none focus:border-emerald-500/60 leading-relaxed resize-none"
                  placeholder="Écrivez vos instructions ici..."
                />
              </div>

              {/* Boutons d'Action : Compiler & Exécuter */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={handleCompile}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <Binary className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Compiler en Bytecode Binaire</span>
                </button>

                <button
                  onClick={handleExecute}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 shadow-lg"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Exécuter sur le Moniteur 330×165</span>
                </button>
              </div>

              {compileSuccess && (
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Compilation binaire réussie ! Bytecode chargé en mémoire.</span>
                </div>
              )}
            </div>

            {/* Colonne Droite (5 colonnes) : Règles de Syntaxe & Opcode Binaire */}
            <div className="lg:col-span-5 space-y-3">
              <div className="bg-stone-950 border border-stone-800 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-stone-800">
                  <span className="text-xs font-bold text-stone-200">
                    Règles & Opcodes du Langage
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">
                    {studio.regles.length} Instructions
                  </span>
                </div>

                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 text-[11px] font-mono">
                  {studio.regles.map((r) => (
                    <div
                      key={r.motCle}
                      className="p-1.5 bg-stone-900/90 border border-stone-800/80 rounded flex items-center justify-between"
                    >
                      <div>
                        <strong className="text-emerald-400">{r.motCle}</strong>
                        <div className="text-[10px] font-sans text-stone-400">{r.description}</div>
                      </div>
                      <span className="text-[10px] text-cyan-300 bg-stone-950 px-1.5 py-0.5 rounded border border-stone-800">
                        {r.opcodeBinaire}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Formulaire d'ajout d'une nouvelle règle de langage */}
                <div className="pt-2 border-t border-stone-800 space-y-1.5 text-xs">
                  <div className="text-[10px] font-bold text-stone-400">
                    Créer une nouvelle instruction :
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      placeholder="MOT_CLE"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      className="bg-stone-900 border border-stone-800 rounded px-2 py-1 text-xs font-mono text-white outline-none focus:border-emerald-500"
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      className="bg-stone-900 border border-stone-800 rounded px-2 py-1 text-xs text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <button
                    onClick={handleAddRule}
                    className="w-full py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded text-[11px] font-medium transition-colors flex items-center justify-center gap-1"
                  >
                    <PlusCircle className="w-3 h-3 text-emerald-400" />
                    <span>Ajouter au Langage</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bytecode Binaire Généré (0bXXXXXXXX) */}
          {compiled && (
            <div className="bg-stone-950 border border-stone-800 rounded-xl p-4 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between text-stone-400 text-[11px] pb-1.5 border-b border-stone-800">
                <span className="font-bold text-stone-300 flex items-center gap-1.5">
                  <Binary className="w-3.5 h-3.5 text-cyan-400" />
                  Flux Binaire Brut Généré ({compiled.octets.length} octets) :
                </span>
                <span>Format Machine : 8 bits par mot</span>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1">
                {compiled.bytecodeBinaire.map((b, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-stone-900 border border-stone-800 text-emerald-300 rounded text-[10px]"
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-stone-800 bg-stone-900 text-xs text-stone-400 font-mono">
          <div>
            Compilateur : {studio.nomLangage} · Cible : PC Virtuel VGA 330×165
          </div>
          <button
            onClick={handleExecute}
            className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 rounded font-bold transition-colors"
          >
            Lancer l'Application
          </button>
        </div>
      </div>
    </div>
  );
};
