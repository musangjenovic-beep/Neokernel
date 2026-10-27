import React, { useState } from 'react';
import { OrdinateurVirtuel } from '../hardware/computer';
import {
  Code,
  Play,
  Binary,
  PlusCircle,
  CheckCircle2,
  HardDrive,
  Usb,
  RotateCcw,
  Sparkles,
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
  const [sourceCode, setSourceCode] = useState<string>(
    `// ==========================================
// SYSTEME D'EXPLOITATION INTERACTIF (RGB 330x165)
// ==========================================
CLEAR 0
COLOR 3

// 1. Sous-routines de dessin initial (CALL / RET)
CALL DESSINER_BUREAU
CALL DESSINER_FENETRE
CALL DESSINER_BOUTONS
SOUND 5

// 2. Boucle Interactive temps réel (30 FPS)
BOUCLE_EVENEMENTS:
  WAIT 30

  // Détection des clics sur les boutons de l'écran
  IF_CLICK 35, 105, 75, 20, ACTION_AUDIO
  IF_CLICK 120, 105, 85, 20, ACTION_REBOOT
  IF_CLICK 215, 105, 85, 20, ACTION_SHUTDOWN

  // Raccourcis clavier
  IF_KEY "1", ACTION_AUDIO
  IF_KEY "R", ACTION_REBOOT
  IF_KEY "S", ACTION_SHUTDOWN

  GOTO BOUCLE_EVENEMENTS

// 3. Actions déclenchées
ACTION_AUDIO:
  SOUND 3
  PRINT 35, 130, ">> Bouton Audio clique avec succes !", 14
  WAIT 200
  PRINT 35, 130, "                                    ", 0
  GOTO BOUCLE_EVENEMENTS

ACTION_REBOOT:
  PRINT 35, 130, ">> Redemarrage du PC en cours...", 12
  SOUND 4
  WAIT 300
  REBOOT

ACTION_SHUTDOWN:
  PRINT 35, 130, ">> Extinction du PC...", 5
  WAIT 300
  SHUTDOWN

// 4. Définition des sous-routines (Groupes de commandes)
DESSINER_BUREAU:
  FILLRECT 0, 0, 330, 12, 8
  PRINT 6, 2, "VIRTUARCH OS v3.5 [BOUTONS & ANIMATION]", 15
  PRINT 240, 2, "MEM: 64Ko OK", 14
  RET

DESSINER_FENETRE:
  FILLRECT 20, 22, 290, 125, 10
  RECT 20, 22, 290, 125, 3
  FILLRECT 20, 22, 290, 14, 3
  PRINT 26, 24, "TABLEAU DE BORD DU SYSTEME", 0

  PRINT 35, 42, "ESPACES CLIQUABLES & GROUPES DE COMMANDES :", 15
  PRINT 35, 56, "-> Cliquez avec la souris sur les boutons ci-dessous !", 6
  PRINT 35, 68, "-> Touches directes : [1] Son, [R] Reboot, [S] Eteindre", 14
  PRINT 35, 80, "-> Code organise en sous-routines avec CALL et RET", 1
  RET

DESSINER_BOUTONS:
  FILLRECT 35, 105, 75, 20, 2
  RECT 35, 105, 75, 20, 15
  PRINT 42, 111, "[1] AUDIO", 0

  FILLRECT 120, 105, 85, 20, 12
  RECT 120, 105, 85, 20, 15
  PRINT 126, 111, "[R] REBOOT", 0

  FILLRECT 215, 105, 85, 20, 5
  RECT 215, 105, 85, 20, 15
  PRINT 222, 111, "[S] ETEINDRE", 15
  RET`
  );
  const [appName, setAppName] = useState<string>('MON_OS_PERSO');
  const [ciblePortUsb, setCiblePortUsb] = useState<1 | 2 | 3>(
    computer.hubUsb.cleUsb.port || 3
  );
  const [newKeyword, setNewKeyword] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [flashSuccessMsg, setFlashSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectTemplate = (idx: number) => {
    const tmpl = studio.modelesProgrammes[idx];
    if (tmpl) {
      setSourceCode(tmpl.code);
      setAppName(tmpl.nom.toUpperCase().replace(/\s+/g, '_'));
    }
  };

  const handleFlashToUsb = () => {
    computer.flasherEtBrancherCleUsb(appName, sourceCode, ciblePortUsb);
    setFlashSuccessMsg(
      `Système "${appName}" flashé avec succès sur la Clé USB et inséré sur le Port ${ciblePortUsb} !`
    );
    setTimeout(() => setFlashSuccessMsg(null), 3500);
    onRefresh();
  };

  const handleFlashAndBoot = () => {
    handleFlashToUsb();
    setTimeout(() => {
      computer.booterDepuisCle();
      onClose();
      onRefresh();
    }, 150);
  };

  const handleAddRule = () => {
    if (!newKeyword.trim()) return;
    studio.ajouterRegle(newKeyword.trim(), newDesc.trim() || 'Instruction personnalisée');
    setNewKeyword('');
    setNewDesc('');
    onRefresh();
  };

  const cle = computer.hubUsb.cleUsb;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-stone-900 border-2 border-stone-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-100 font-sans">
        {/* En-tête */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Éditeur de Système d'Exploitation & Flasheur Clé USB</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Ports USB 1, 2, 3
                </span>
              </h2>
              <p className="text-[11px] text-stone-400">
                Écrivez votre système personnalisé, flashez-le sur la clé USB et insérez-la sur le Port 1, 2 ou 3 pour booter
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

        {/* Corps */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Sélection du Port USB d'insertion & État de la clé */}
          <div className="p-3 bg-stone-950 border border-stone-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Usb className="w-4 h-4 text-amber-400" />
              <div>
                <span className="font-semibold text-stone-200">Emplacement physique de la Clé USB :</span>
                <span className="text-[11px] text-stone-400 ml-2">
                  Actuellement : {cle.estBranchee ? `Branchée sur Port ${cle.port}` : 'Éjectée'}
                  {cle.estBootable ? ` (${cle.nomSysteme} prêt)` : ' (Vierge)'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-stone-400">Insérer sur :</span>
              {([1, 2, 3] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setCiblePortUsb(p);
                    computer.hubUsb.brancherCleSurPort(p);
                    computer.os.rafraichirBureau();
                    onRefresh();
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors ${
                    cle.estBranchee && cle.port === p
                      ? 'bg-amber-500 text-stone-950 font-bold'
                      : 'bg-stone-900 border border-stone-800 text-stone-300 hover:text-white'
                  }`}
                >
                  Port {p}
                </button>
              ))}
              <button
                onClick={() => {
                  computer.hubUsb.debrancherCle();
                  computer.os.rafraichirBureau();
                  onRefresh();
                }}
                className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors ${
                  !cle.estBranchee
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                Éjecter
              </button>
            </div>
          </div>

          {/* Grille : Éditeur + Règles */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Colonne Éditeur (7 colonnes) */}
            <div className="lg:col-span-7 space-y-3">
              {/* Modèles */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-stone-400 text-[11px]">Modèles de départ :</span>
                <div className="flex items-center gap-1">
                  {studio.modelesProgrammes.map((tmpl, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectTemplate(idx)}
                      className="px-2 py-0.5 rounded text-[11px] font-medium bg-stone-950 border border-stone-800 text-stone-400 hover:text-white hover:border-emerald-500/40 transition-colors"
                    >
                      {tmpl.nom}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nom du système */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-stone-400 text-[11px]">Nom du Système :</span>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value.toUpperCase())}
                  className="flex-1 bg-stone-950 border border-stone-800 rounded px-2.5 py-1 font-mono text-emerald-300 outline-none focus:border-emerald-500"
                  placeholder="EX: MON_OS"
                />
              </div>

              {/* Textarea Code Source */}
              <textarea
                value={sourceCode}
                onChange={(e) => setSourceCode(e.target.value)}
                rows={11}
                spellCheck={false}
                className="w-full p-3 bg-stone-950 border border-stone-800 rounded-lg text-xs font-mono text-emerald-300 outline-none focus:border-emerald-500/60 leading-relaxed resize-none"
                placeholder="Écrivez le code de votre système d'exploitation ici..."
              />

              {/* Actions de flashage */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <button
                  onClick={handleFlashToUsb}
                  className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                  <span>1. Flasher sur la Clé USB (Port {ciblePortUsb})</span>
                </button>

                <button
                  onClick={handleFlashAndBoot}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 shadow-lg"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>2. Flasher & Booter Immédiatement</span>
                </button>
              </div>

              {flashSuccessMsg && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{flashSuccessMsg}</span>
                </div>
              )}
            </div>

            {/* Colonne Opcodes & Règles (5 colonnes) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="bg-stone-950 border border-stone-800 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-stone-800">
                  <span className="text-xs font-bold text-stone-200">
                    Instructions & Opcodes Reconnus
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

                {/* Formulaire ajout règle */}
                <div className="pt-2 border-t border-stone-800 space-y-1.5 text-xs">
                  <div className="text-[10px] font-bold text-stone-400">
                    Ajouter une nouvelle instruction au compilateur :
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
                    <span>Enregistrer dans le compilateur</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bytecode enregistré sur la clé */}
          {cle.bytecodeBinaire.length > 0 && (
            <div className="bg-stone-950 border border-stone-800 rounded-xl p-3.5 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between text-stone-400 text-[11px] pb-1 border-b border-stone-800">
                <span className="font-bold text-stone-300 flex items-center gap-1.5">
                  <Binary className="w-3.5 h-3.5 text-cyan-400" />
                  Contenu Binaire Inscrit sur la Clé USB ({cle.bytecode.length} octets) :
                </span>
                <span>Fichier : BOOT.BIN (Port {cle.port})</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1">
                {cle.bytecodeBinaire.map((b, i) => (
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
            Support : Clé USB bootable sur Port 1, Port 2 ou Port 3 · RAM : 64 KB (initialisée à 0x00)
          </div>
          <button
            onClick={handleFlashAndBoot}
            className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 rounded font-bold transition-colors"
          >
            Flasher & Booter
          </button>
        </div>
      </div>
    </div>
  );
};
