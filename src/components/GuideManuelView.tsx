import React, { useState } from 'react';
import {
  BookOpen,
  Cpu,
  Database,
  HardDrive,
  FileCode,
  Terminal,
  Play,
  Check,
  Copy,
  Layers,
  Sparkles,
  Sliders,
  ChevronRight,
  ShieldAlert,
  Tv,
  Volume2,
} from 'lucide-react';
import { OrdinateurVirtuel } from '../hardware/computer';
import { Instruction } from '../types/virtualComputer';

interface GuideManuelViewProps {
  ordinateur: OrdinateurVirtuel;
  onLoadProgram: (instructions: Instruction[], baseAddr?: number) => void;
  onRefresh: () => void;
}

export const GuideManuelView: React.FC<GuideManuelViewProps> = ({
  ordinateur,
  onLoadProgram,
  onRefresh,
}) => {
  const [sectionActive, setSectionActive] = useState<
    'intro' | 'assembleur' | 'kernel_os' | 'parametres' | 'persistance' | 'apps' | 'json' | 'securite' | 'materiel_crt'
  >('intro');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [injectionSuccess, setInjectionSuccess] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInjectOsCode = (source: string, message: string) => {
    ordinateur.os.rechargerCodeOS(source);
    setInjectionSuccess(message);
    onRefresh();
    setTimeout(() => setInjectionSuccess(null), 3000);
  };

  const handleInjectCpuJson = (instructions: Instruction[], message: string) => {
    onLoadProgram(instructions, 0x0080);
    ordinateur.cpu.reset(false);
    setInjectionSuccess(message);
    onRefresh();
    setTimeout(() => setInjectionSuccess(null), 3000);
  };

  const SECTIONS = [
    { id: 'intro', label: '1. Architecture & Registres', icon: Cpu },
    { id: 'assembleur', label: '2. Jeu d\'Instructions', icon: Terminal },
    { id: 'kernel_os', label: '3. Créer son OS de Zéro', icon: Layers },
    { id: 'parametres', label: '4. Coder les Paramètres & E/S', icon: Sliders },
    { id: 'persistance', label: '5. Enregistrer (Disque & DBD)', icon: HardDrive },
    { id: 'apps', label: '6. Créer des Applications', icon: FileCode },
    { id: 'json', label: '7. Format d\'Injection JSON', icon: Database },
    { id: 'securite', label: '8. Sécurité (Double-Appui / Maintien)', icon: ShieldAlert },
    { id: 'materiel_crt', label: '9. Matériel & Audio Réaliste', icon: Tv },
  ] as const;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Menu Latéral des Chapitres du Guide */}
      <div className="w-full lg:w-64 shrink-0 space-y-1">
        <div className="px-3 py-2 text-xs font-mono font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-400" />
          <span>Manuel du Développeur</span>
        </div>

        {SECTIONS.map((sec) => {
          const Icon = sec.icon;
          const isActive = sectionActive === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => setSectionActive(sec.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-mono font-medium transition-all text-left ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold shadow-sm'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-stone-500'}`} />
                <span className="truncate">{sec.label}</span>
              </div>
              <ChevronRight className={`w-3 h-3 ${isActive ? 'text-emerald-400' : 'text-stone-600'}`} />
            </button>
          );
        })}

        {injectionSuccess && (
          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs font-mono text-emerald-300 flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{injectionSuccess}</span>
          </div>
        )}
      </div>

      {/* Contenu Détaillé du Chapitre Sélectionné */}
      <div className="flex-1 min-w-0 bg-stone-950 border border-stone-800 rounded-xl p-4 sm:p-6 space-y-6 text-sm text-stone-300 leading-relaxed font-sans">
        {/* CHAPITRE 1 : ARCHITECTURE & REGISTRES */}
        {sectionActive === 'intro' && (
          <div className="space-y-4">
            <div className="border-b border-stone-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-emerald-400" />
                Chapitre 1 : Architecture Matérielle & Registres du Processeur
              </h3>
              <p className="text-xs text-stone-400 font-mono mt-1">
                Comprendre le cœur du processeur RISC 8-Bit et l'organisation de la mémoire RAM 64 Ko
              </p>
            </div>

            <p>
              L'ordinateur virtuel <strong>VirtuArch</strong> simule un processeur 8-bit cadencé à 20 MHz avec un bus de données 8 bits et un bus d'adresses 16 bits. Il exécute les instructions selon le cycle classique de von Neumann :
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs font-mono">
              <div className="bg-stone-900 border border-stone-800 p-2 rounded">
                <div className="text-emerald-400 font-bold">1. FETCH</div>
                <div className="text-[10px] text-stone-500">Lecture RAM[PC]</div>
              </div>
              <div className="bg-stone-900 border border-stone-800 p-2 rounded">
                <div className="text-cyan-400 font-bold">2. DECODE</div>
                <div className="text-[10px] text-stone-500">Décodage Opcode</div>
              </div>
              <div className="bg-stone-900 border border-stone-800 p-2 rounded">
                <div className="text-amber-400 font-bold">3. EXECUTE</div>
                <div className="text-[10px] text-stone-500">Calcul ALU</div>
              </div>
              <div className="bg-stone-900 border border-stone-800 p-2 rounded">
                <div className="text-purple-400 font-bold">4. WRITEBACK</div>
                <div className="text-[10px] text-stone-500">Écriture Registre</div>
              </div>
              <div className="bg-stone-900 border border-stone-800 p-2 rounded">
                <div className="text-rose-400 font-bold">5. IRQ CHECK</div>
                <div className="text-[10px] text-stone-500">Gestion Interruptions</div>
              </div>
            </div>

            <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider pt-2">
              Les Registres Internes :
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 bg-stone-900/80 border border-stone-800 rounded-lg">
                <span className="text-emerald-400 font-bold">PC (Program Counter)</span>
                <p className="text-stone-400 mt-1 font-sans">
                  Pointeur de l'instruction en cours d'exécution. S'incrémente après chaque lecture ou saute lors d'un <code>JMP/CALL</code>.
                </p>
              </div>
              <div className="p-3 bg-stone-900/80 border border-stone-800 rounded-lg">
                <span className="text-emerald-400 font-bold">SP (Stack Pointer)</span>
                <p className="text-stone-400 mt-1 font-sans">
                  Pointeur du sommet de la pile d'appels. Démarre en haut de la RAM à <code>0xFFFE</code> et descend vers le bas.
                </p>
              </div>
              <div className="p-3 bg-stone-900/80 border border-stone-800 rounded-lg">
                <span className="text-cyan-400 font-bold">A (Accumulateur) & B</span>
                <p className="text-stone-400 mt-1 font-sans">
                  Registres centraux pour les calculs arithmétiques. A reçoit le résultat de l'ALU, B reçoit le reste des divisions (modulo).
                </p>
              </div>
              <div className="p-3 bg-stone-900/80 border border-stone-800 rounded-lg">
                <span className="text-cyan-400 font-bold">R0, R1, R2, R3 & IX</span>
                <p className="text-stone-400 mt-1 font-sans">
                  Quatre registres polyvalents pour vos boucles et pointeurs, plus <code>IX</code> (Index Register) pour parcourir des tableaux.
                </p>
              </div>
            </div>

            <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider pt-2">
              Les Drapeaux d'État (Flags) :
            </h4>
            <div className="flex flex-wrap gap-2 text-xs font-mono">
              <span className="px-2 py-1 bg-stone-900 border border-stone-800 rounded text-stone-300">
                <strong className="text-emerald-400">Z (Zero)</strong> : Résultat = 0
              </span>
              <span className="px-2 py-1 bg-stone-900 border border-stone-800 rounded text-stone-300">
                <strong className="text-amber-400">S (Sign)</strong> : Résultat négatif
              </span>
              <span className="px-2 py-1 bg-stone-900 border border-stone-800 rounded text-stone-300">
                <strong className="text-cyan-400">C (Carry)</strong> : Retenue arithmétique
              </span>
              <span className="px-2 py-1 bg-stone-900 border border-stone-800 rounded text-stone-300">
                <strong className="text-rose-400">O (Overflow)</strong> : Débordement
              </span>
              <span className="px-2 py-1 bg-stone-900 border border-stone-800 rounded text-stone-300">
                <strong className="text-purple-400">I (Interrupts)</strong> : Interruptions actives (1=STI, 0=CLI)
              </span>
            </div>
          </div>
        )}

        {/* CHAPITRE 2 : JEU D'INSTRUCTIONS */}
        {sectionActive === 'assembleur' && (
          <div className="space-y-4">
            <div className="border-b border-stone-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Terminal className="w-5 h-5 text-cyan-400" />
                Chapitre 2 : Jeu d'Instructions Assembleur Complet
              </h3>
              <p className="text-xs text-stone-400 font-mono mt-1">
                La référence de toutes les opérations machines acceptées par le processeur
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-stone-800 text-stone-400 bg-stone-900/50">
                    <th className="p-2">Opcode</th>
                    <th className="p-2">Syntaxe</th>
                    <th className="p-2">Effet Matériel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/50">
                  <tr>
                    <td className="p-2 text-emerald-400 font-bold">MOV</td>
                    <td className="p-2 text-stone-300">MOV dst, src</td>
                    <td className="p-2 text-stone-400">Copie une valeur immédiate ou registre vers un autre</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-emerald-400 font-bold">LOAD / STORE</td>
                    <td className="p-2 text-stone-300">LOAD reg, addr / STORE reg, addr</td>
                    <td className="p-2 text-stone-400">Lit ou écrit un mot mémoire à l'adresse RAM indiquée</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-emerald-400 font-bold">PUSH / POP</td>
                    <td className="p-2 text-stone-300">PUSH reg / POP reg</td>
                    <td className="p-2 text-stone-400">Empile ou dépile une valeur sur la pile système (SP)</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-cyan-400 font-bold">ADD / SUB / MUL</td>
                    <td className="p-2 text-stone-300">ADD dst, src</td>
                    <td className="p-2 text-stone-400">Calcul arithmétique ALU, met à jour les flags (Z, S, C)</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-cyan-400 font-bold">CMP</td>
                    <td className="p-2 text-stone-300">CMP opA, opB</td>
                    <td className="p-2 text-stone-400">Soustraction de test pour comparer sans modifier de registre</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-amber-400 font-bold">JMP / JZ / JNZ</td>
                    <td className="p-2 text-stone-300">JZ adresse_ou_label</td>
                    <td className="p-2 text-stone-400">Saut conditionnel si le flag Zéro est actif</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-amber-400 font-bold">CALL / RET</td>
                    <td className="p-2 text-stone-300">CALL routine / RET</td>
                    <td className="p-2 text-stone-400">Appel de sous-programme avec sauvegarde de l'adresse de retour</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-purple-400 font-bold">IN / OUT</td>
                    <td className="p-2 text-stone-300">IN port, reg / OUT port, reg</td>
                    <td className="p-2 text-stone-400">Communication directe avec les ports USB, VGA et Audio</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-rose-400 font-bold">CLI / STI / RTI</td>
                    <td className="p-2 text-stone-300">CLI / STI / RTI</td>
                    <td className="p-2 text-stone-400">Masquer ou activer les interruptions, et retour d'interruption</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-blue-400 font-bold">DISK_READ / WRITE</td>
                    <td className="p-2 text-stone-300">DISK_WRITE sect, addr</td>
                    <td className="p-2 text-stone-400">Écrit ou lit un secteur de 64 octets sur le disque dur virtuel</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-blue-400 font-bold">DBD_SET / GET</td>
                    <td className="p-2 text-stone-300">DBD_SET cle, pointeur</td>
                    <td className="p-2 text-stone-400">Insère ou recherche dans l'arbre d'indexation ultra-rapide</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CHAPITRE 3 : CRÉER SON PROPRE OS */}
        {sectionActive === 'kernel_os' && (
          <div className="space-y-4">
            <div className="border-b border-stone-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                Chapitre 3 : Comment Créer son Propre Système d'Exploitation
              </h3>
              <p className="text-xs text-stone-400 font-mono mt-1">
                La méthode pas-à-pas pour construire votre noyau (Kernel) à partir de zéro
              </p>
            </div>

            <p>
              Pour qu'un ordinateur démarre sans système d'exploitation préexistant, votre code doit accomplir <strong>4 tâches indispensables</strong> :
            </p>

            <ol className="list-decimal list-inside space-y-2 text-xs font-mono text-stone-300">
              <li>
                <strong className="text-white">Écrire la Table des Vecteurs d'Interruption (IVT)</strong> à l'adresse <code>0x0000</code> pour dire au processeur où sauter quand le PC démarre ou quand une touche est frappée.
              </li>
              <li>
                <strong className="text-white">Placer le Stack Pointer (SP)</strong> à <code>0xFFFE</code> pour que la pile ne rentre pas en collision avec vos variables.
              </li>
              <li>
                <strong className="text-white">Initialiser vos pilotes</strong> (effacer l'écran VRAM, connecter les ports USB 1 et 2).
              </li>
              <li>
                <strong className="text-white">Lancer la boucle Kernel Loop</strong> et activer les interruptions avec <code>STI</code>.
              </li>
            </ol>

            <div className="p-3 bg-stone-900 border border-stone-800 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  Exemple : Code Complet du Noyau "MyMiniKernel"
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      handleCopy(
                        'os_code_snippet',
                        `// SÉQUENCE DE BOOT DE MON NOYAU
BOOT_SEQUENCE:
  0b00000001  // INIT_VGA_330X165
  0b00000010  // MOUNT_USB_HUB
  0b00000011  // LOAD_WINDOW_MANAGER
  0b00000100  // ENABLE_INTERRUPTS

UI_DESKTOP_STYLE:
  COLOR_BAR_TITLE = 0b0011
  COLOR_TEXT_MAIN = 0b0001

LOOP:
  WAIT_FOR_EVENT
  HANDLE_USB_KEYBOARD_SCANCODE
  REFRESH_VRAM_DISPLAY
  JUMP LOOP`
                      )
                    }
                    className="flex items-center gap-1 px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded text-[11px] font-mono border border-stone-700"
                  >
                    {copiedId === 'os_code_snippet' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copier</span>
                  </button>
                  <button
                    onClick={() =>
                      handleInjectOsCode(
                        `// ==========================================
// MON SYSTEME D'EXPLOITATION CUSTOM
// ==========================================
BOOT_SEQUENCE:
  0b00000001  // INIT_VGA
  0b00000010  // MOUNT_USB
  0b00000011  // LOAD_DESKTOP
  0b00000100  // ENABLE_INTERRUPTS

UI_DESKTOP_STYLE:
  COLOR_BAR_TITLE = 0b0011
  COLOR_TEXT_MAIN = 0b0001

LOOP:
  WAIT_FOR_EVENT
  REFRESH_VRAM_DISPLAY
  JUMP LOOP`,
                        'Nouveau noyau injecté dans le PC !'
                      )
                    }
                    className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold rounded text-[11px] font-mono shadow"
                  >
                    <Play className="w-3 h-3" />
                    <span>Tester cet OS</span>
                  </button>
                </div>
              </div>
              <pre className="text-[11px] font-mono text-stone-300 overflow-x-auto p-2 bg-stone-950 rounded border border-stone-800">
{`BOOT_SEQUENCE:
  0b00000001  // Initialise l'écran VRAM 330x165
  0b00000010  // Monte le hub USB 1, 2, 3
  0b00000011  // Charge le gestionnaire de fenêtres
  0b00000100  // Active les interruptions matérielles (STI)

LOOP:
  WAIT_FOR_EVENT
  HANDLE_USB_KEYBOARD_SCANCODE
  REFRESH_VRAM_DISPLAY
  JUMP LOOP`}
              </pre>
            </div>
          </div>
        )}

        {/* CHAPITRE 4 : PARAMÈTRES & PORTS E/S */}
        {sectionActive === 'parametres' && (
          <div className="space-y-4">
            <div className="border-b border-stone-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-400" />
                Chapitre 4 : Programmer les Paramètres & la Gestion des Ports E/S
              </h3>
              <p className="text-xs text-stone-400 font-mono mt-1">
                Comment lire les périphériques connectés et modifier les paramètres de l'ordinateur
              </p>
            </div>

            <p>
              Pour communiquer avec les branchements matériels, le processeur utilise deux instructions directes :
              <code>IN port, registre</code> pour lire, et <code>OUT port, registre</code> pour écrire.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 bg-stone-900 border border-stone-800 rounded-lg">
                <span className="text-emerald-400 font-bold">Port 0 : Écran VGA (330x165)</span>
                <p className="text-stone-400 font-sans mt-1">
                  Envoie le code couleur binaire 4-bits (ex: <code>0b0001</code> pour vert, <code>0b0010</code> pour ambre, <code>0b0011</code> pour cyan).
                </p>
              </div>
              <div className="p-3 bg-stone-900 border border-stone-800 rounded-lg">
                <span className="text-emerald-400 font-bold">Port 1 : Clavier USB</span>
                <p className="text-stone-400 font-sans mt-1">
                  Reçoit le scancode binaire (8 bits) de la touche pressée lors de l'interruption IRQ1.
                </p>
              </div>
              <div className="p-3 bg-stone-900 border border-stone-800 rounded-lg">
                <span className="text-cyan-400 font-bold">Port 2 : Souris USB</span>
                <p className="text-stone-400 font-sans mt-1">
                  Transmet la coordonnée X, la coordonnée Y et l'état des clics gauche/droit.
                </p>
              </div>
              <div className="p-3 bg-stone-900 border border-stone-800 rounded-lg">
                <span className="text-amber-400 font-bold">Port 3 : Sortie Audio Jack</span>
                <p className="text-stone-400 font-sans mt-1">
                  Écrire une valeur (ex: 440) déclenche immédiatement une onde carrée à cette fréquence en Hertz.
                </p>
              </div>
            </div>

            <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider pt-2">
              Comment coder une structure de paramètres en RAM :
            </h4>
            <pre className="text-[11px] font-mono text-emerald-300 p-3 bg-stone-900 rounded border border-stone-800 overflow-x-auto">
{`; Définir la table de configuration à l'adresse fixe 0x0020 :
STORE 0xCAFE, 0x0020    ; Signature magique de validation
STORE 0b0001, 0x0021    ; Paramètre 1 : Thème Vert Phosphore (0b0001)
STORE 1,      0x0022    ; Paramètre 2 : Audio activé (1) ou muet (0)
STORE 250,    0x0023    ; Paramètre 3 : Fréquence de répétition des touches`}
            </pre>
          </div>
        )}

        {/* CHAPITRE 5 : PERSISTANCE, DISQUE & DBD */}
        {sectionActive === 'persistance' && (
          <div className="space-y-4">
            <div className="border-b border-stone-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-purple-400" />
                Chapitre 5 : Persistance des Données (Disque Virtuel & Index DBD)
              </h3>
              <p className="text-xs text-stone-400 font-mono mt-1">
                Sauvegarder vos fichiers, documents et bases de données sur le stockage non-volatile
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white font-mono uppercase">
                1. Le Disque Dur Virtuel (8 Secteurs de 64 Octets)
              </h4>
              <p>
                Contrairement à la RAM qui s'efface à chaque redémarrage, le disque dur conserve ses octets. Vous pouvez transférer des blocs entiers de données avec les instructions <code>DISK_WRITE</code> et <code>DISK_READ</code> :
              </p>
              <pre className="text-[11px] font-mono text-stone-300 p-3 bg-stone-900 rounded border border-stone-800 overflow-x-auto">
{`; Écriture de 64 octets vers le Secteur 3 :
DISK_WRITE 3, 0x2000    ; Copie les 64 octets de RAM[0x2000..0x203F] sur le secteur 3

; Relecture ultérieure après redémarrage :
DISK_READ 3, 0x2000     ; Restaure les 64 octets dans la RAM`}
              </pre>

              <h4 className="text-sm font-bold text-white font-mono uppercase pt-2">
                2. L'Index DBD (Arbre Binaire de Recherche en Mémoire)
              </h4>
              <p>
                Pour éviter d'avoir à scanner toute la mémoire à la recherche d'un document, l'index DBD utilise une structure d'arbre binaire de recherche optimisée pour des temps d'accès quasi-instantanés en $O(\log N)$ :
              </p>
              <pre className="text-[11px] font-mono text-stone-300 p-3 bg-stone-900 rounded border border-stone-800 overflow-x-auto">
{`; Insérer un enregistrement : Clé = 42, Pointeur Données = 0x2400
DBD_SET 42, 0x2400

; Rechercher la clé 42 :
DBD_GET 42
; Le registre A contient immédiatement l'adresse 0x2400 !`}
              </pre>
            </div>
          </div>
        )}

        {/* CHAPITRE 6 : CRÉER DES APPLICATIONS */}
        {sectionActive === 'apps' && (
          <div className="space-y-4">
            <div className="border-b border-stone-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileCode className="w-5 h-5 text-emerald-400" />
                Chapitre 6 : Créer des Applications (Graphisme, Souris, Audio)
              </h3>
              <p className="text-xs text-stone-400 font-mono mt-1">
                Concevoir des logiciels fonctionnant sur l'écran 330×165 et le processeur virtuel
              </p>
            </div>

            <p>
              Le système intègre un <strong>Studio de Langages</strong> qui traduit vos commandes en bytecode binaire exécuté directement par le contrôleur graphique et la carte son.
            </p>

            <div className="space-y-3">
              <div className="p-3 bg-stone-900 border border-stone-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-emerald-400 font-bold">
                    Exemple d'Application : Boîte de Dialogue Graphique & Sonore
                  </span>
                  <button
                    onClick={() => {
                      ordinateur.os.compilerEtCharger(
                        `CLEAR
RECT 25, 20, 280, 115
PRINT 45, 35, "FENETRE D'APPLICATION PERSONNALISEE"
LINE 45, 48, 285, 48
PRINT 45, 60, "Graphisme en VRAM 330x165 (5x7 Font)"
PRINT 45, 75, "Palette binaire 16 teintes operationnelle"
BEEP 440
BEEP 880
HALT`,
                        'Fenetre Custom'
                      );
                      ordinateur.os.executerApplicationBinaire();
                      setInjectionSuccess("Application compilée et lancée sur l'écran !");
                      onRefresh();
                      setTimeout(() => setInjectionSuccess(null), 3000);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold rounded text-[11px] font-mono shadow"
                  >
                    <Play className="w-3 h-3" />
                    <span>Compiler & Lancer</span>
                  </button>
                </div>
                <pre className="text-[11px] font-mono text-stone-300 p-2 bg-stone-950 rounded border border-stone-800">
{`CLEAR
RECT 25, 20, 280, 115
PRINT 45, 35, "FENETRE D'APPLICATION PERSONNALISEE"
LINE 45, 48, 285, 48
PRINT 45, 60, "Graphisme en VRAM 330x165 (5x7 Font)"
PRINT 45, 75, "Palette binaire 16 teintes operationnelle"
BEEP 440
BEEP 880
HALT`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* CHAPITRE 7 : FORMAT D'INJECTION JSON */}
        {sectionActive === 'json' && (
          <div className="space-y-4">
            <div className="border-b border-stone-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-cyan-400" />
                Chapitre 7 : Format d'Injection JSON pour le Processeur
              </h3>
              <p className="text-xs text-stone-400 font-mono mt-1">
                Injecter directement des séquences d'instructions bas-niveau sans compilation
              </p>
            </div>

            <p>
              Vous pouvez injecter n'importe quel code machine bas niveau via un simple tableau JSON d'instructions. Chaque objet décrit une instruction élémentaire :
            </p>

            <div className="p-3 bg-stone-900 border border-stone-800 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-cyan-400 font-bold">
                  Exemple JSON Prêt à Injecter :
                </span>
                <button
                  onClick={() => {
                    const testInstructions: Instruction[] = [
                      { op: 'CLI', comment: 'Desactive interruptions' },
                      { op: 'CLEAR_SCREEN', val: 0, comment: 'Fond noir' },
                      { op: 'DRAW_TEXT', text: 'SYSTEME INJECTE PAR JSON !', dst: 30, src: 35, comment: 'Titre' },
                      { op: 'MOV', dst: 'A', val: 25, comment: 'A = 25' },
                      { op: 'MOV', dst: 'R0', val: 17, comment: 'R0 = 17' },
                      { op: 'ADD', dst: 'A', src: 'R0', comment: 'A = 25 + 17 = 42' },
                      { op: 'STORE', src: 'A', addr: 32, comment: 'Sauvegarde 42 a 0x0020' },
                      { op: 'DRAW_TEXT', text: 'CALCUL TERMINE : A = 42 (ENREGISTRE EN RAM)', dst: 30, src: 60, comment: 'Status' },
                      { op: 'HALT', comment: 'Fin' },
                    ];
                    handleInjectCpuJson(testInstructions, 'Programme JSON injecté et prêt sur le CPU !');
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-stone-950 font-bold rounded text-[11px] font-mono shadow"
                >
                  <Play className="w-3 h-3" />
                  <span>Injecter dans le CPU</span>
                </button>
              </div>

              <pre className="text-[11px] font-mono text-stone-300 p-2 bg-stone-950 rounded border border-stone-800 overflow-x-auto">
{`[
  { "op": "CLI", "comment": "Désactive interruptions" },
  { "op": "CLEAR_SCREEN", "val": 0, "comment": "Fond noir" },
  { "op": "DRAW_TEXT", "text": "SYSTEME INJECTE PAR JSON !", "dst": 30, "src": 35 },
  { "op": "MOV", "dst": "A", "val": 25 },
  { "op": "MOV", "dst": "R0", "val": 17 },
  { "op": "ADD", "dst": "A", "src": "R0" },
  { "op": "STORE", "src": "A", "addr": 32 },
  { "op": "DRAW_TEXT", "text": "CALCUL TERMINE : A = 42", "dst": 30, "src": 60 },
  { "op": "HALT" }
]`}
              </pre>
            </div>
          </div>
        )}

        {/* SECTION 8 : SÉCURITÉ DES COMMANDES (DOUBLE-APPUI / MAINTIEN) */}
        {sectionActive === 'securite' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <span>8. Sécurité des Commandes Système (Protection Anti-Fausses Frappes)</span>
              </h3>
              <p className="text-xs text-stone-400 mt-1">
                Pourquoi et comment sécuriser les touches critiques du BIOS ([B] Boot, [H] Hello World, [ESC] Reset) avec une confirmation armée à double-appui ou maintien prolongé.
              </p>
            </div>

            <div className="p-4 bg-stone-900 border border-stone-800 rounded-xl space-y-3 text-xs leading-relaxed">
              <h4 className="font-bold text-amber-300">Le problème en développement d'OS :</h4>
              <p className="text-stone-300">
                Lorsqu'on tape du code ou qu'on utilise un clavier virtuel, effleurer accidentellement la touche <code className="text-rose-400 font-mono">[ESC]</code> ou <code className="text-amber-400 font-mono">[B]</code> peut réinitialiser immédiatement la machine et détruire l'état de la mémoire vive (RAM).
              </p>
              <p className="text-stone-300">
                Dans les vrais ordinateurs (BIOS IBM, serveurs, microcontrôleurs industriels), les opérations critiques de redémarrage ou de changement de système exigent une <strong>temporisation de garde</strong> ou une <strong>combinaison de touches</strong> (comme le fameux <em>Ctrl+Alt+Suppr</em>).
              </p>
            </div>

            <div className="p-4 bg-stone-900 border border-stone-800 rounded-xl space-y-3 text-xs">
              <h4 className="font-bold text-emerald-300">Le Système de Confirmation Armée VirtuArch :</h4>
              <ul className="list-disc list-inside space-y-2 text-stone-300">
                <li>
                  <strong>1er Appui :</strong> La machine émet un bip d'avertissement (380 Hz) et affiche un bandeau haute visibilité sur la VRAM :
                  <div className="mt-1 px-3 py-1.5 bg-amber-400 text-stone-950 font-mono font-bold rounded inline-block text-[11px]">
                    ! CONFIRMER : Reappuyez sur [B] (3s)
                  </div>
                </li>
                <li>
                  <strong>2e Appui (sous 3 secondes) ou Maintien Enfoncé :</strong> La commande est validée. L'action s'exécute avec le bruit du moteur pas-à-pas de disque et l'allumage de la LED HDD.
                </li>
                <li>
                  <strong>Expiration :</strong> Si aucune confirmation n'a lieu dans les 3 secondes, l'alerte disparaît et le travail reste 100% intact.
                </li>
              </ul>

              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={() => {
                    ordinateur.os.verifierOuDeclencherAlerteSecurite(
                      'BOOT_BOS',
                      'B',
                      'Test Sécurité Boot',
                      () => {
                        ordinateur.activerAccesDisque(400, 4);
                        ordinateur.os.chargerOsBureau();
                      }
                    );
                    onRefresh();
                  }}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold font-mono rounded text-xs transition-colors flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Tester l'Alerte de Sécurité [B]</span>
                </button>
                <span className="text-stone-500 text-[11px]">Observez le bandeau jaune sur l'écran CRT</span>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 9 : MATÉRIEL CRT & SYNTHÈSE AUDIO RÉALISTE */}
        {sectionActive === 'materiel_crt' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Tv className="w-5 h-5 text-cyan-400" />
                <span>9. Périphériques Haute-Fidélité & Synthèse Réaliste</span>
              </h3>
              <p className="text-xs text-stone-400 mt-1">
                Présentation des mécanismes physiques intégrés pour une immersion totale dans le rétro-computing.
              </p>
            </div>

            {/* Moniteur CRT */}
            <div className="p-4 bg-stone-900 border border-stone-800 rounded-xl space-y-3 text-xs">
              <h4 className="font-bold text-cyan-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Moniteur Cathodique VirtuArch CRT-330 :</span>
              </h4>
              <ul className="list-disc list-inside space-y-2 text-stone-300">
                <li>
                  <strong>Bobine de Démagnétisation (Bouton DÉMAG) :</strong> Supprime le magnétisme résiduel de la grille shadow-mask. Produit le grondement caractéristique 50 Hz et une secousse magnétique sur la vitre.
                </li>
                <li>
                  <strong>Sélecteur de Phosphore Matériel :</strong> Bascule à la volée entre <strong>RGB</strong> (palette 16 couleurs 4-bits), <strong>P1 Vert</strong> (vert terminal willemite), <strong>P3 Ambre</strong> (orange chaud) et <strong>P4 Blanc Papier</strong>.
                </li>
                <li>
                  <strong>Lignes de Balayage (Bouton SCAN) :</strong> Affiche les scanlines d'entrelacement du faisceau d'électrons CRT.
                </li>
                <li>
                  <strong>LED d'activité HDD (Ambre) :</strong> Clignote en direct lors des accès au disque, du formatage ou de la compilation.
                </li>
              </ul>

              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    ordinateur.declencherDegauss(onRefresh);
                  }}
                  className="px-3 py-1.5 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 rounded text-xs font-mono font-bold transition-all"
                >
                  Tester Démagnétisation (DÉMAG)
                </button>
                <button
                  onClick={() => {
                    ordinateur.activerAccesDisque(500, 5);
                    onRefresh();
                  }}
                  className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded text-xs font-mono font-bold transition-all"
                >
                  Tester Moteur FDD/HDD Seek
                </button>
              </div>
            </div>

            {/* Synthèse Sonore Web Audio */}
            <div className="p-4 bg-stone-900 border border-stone-800 rounded-xl space-y-3 text-xs">
              <h4 className="font-bold text-emerald-300 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>Synthétiseur Sonore Physique (Jack 3.5mm) :</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-stone-300">
                <div className="p-2.5 bg-stone-950 rounded border border-stone-800 space-y-1">
                  <div className="font-bold text-emerald-400">Switches Clavier Mécaniques</div>
                  <div className="text-stone-400 text-[11px]">
                    Impact tactile avec variation organique pour chaque touche frappée.
                  </div>
                </div>
                <div className="p-2.5 bg-stone-950 rounded border border-stone-800 space-y-1">
                  <div className="font-bold text-cyan-400">Microswitches Souris Optique</div>
                  <div className="text-stone-400 text-[11px]">
                    Double tonalité distincte : clic gauche 880 Hz et clic droit 720 Hz.
                  </div>
                </div>
                <div className="p-2.5 bg-stone-950 rounded border border-stone-800 space-y-1">
                  <div className="font-bold text-amber-400">Moteur Pas-à-Pas (Seek)</div>
                  <div className="text-stone-400 text-[11px]">
                    Cliquetis mécanique de balayage de la tête sur les pistes du disque.
                  </div>
                </div>
                <div className="p-2.5 bg-stone-950 rounded border border-stone-800 space-y-1">
                  <div className="font-bold text-rose-400">Bip BIOS POST (800 Hz)</div>
                  <div className="text-stone-400 text-[11px]">
                    Validation matérielle du démarrage Power-On Self-Test standard.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

