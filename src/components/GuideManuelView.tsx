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
    'intro' | 'assembleur' | 'kernel_os' | 'parametres' | 'persistance' | 'apps' | 'json' | 'securite' | 'materiel_crt' | 'bios_usb'
  >('intro');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [injectionSuccess, setInjectionSuccess] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInjectOsCode = (source: string, message: string) => {
    const port = ordinateur.hubUsb.cleUsb.port || 3;
    ordinateur.flasherEtBrancherCleUsb('OS_GUIDE', source, port);
    setInjectionSuccess(`${message} (Flashé sur Clé USB Port ${port})`);
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
    { id: 'bios_usb', label: '10. Vrai BIOS & Boot USB Multi-Ports', icon: HardDrive },
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
                      const port = ordinateur.hubUsb.cleUsb.port || 3;
                      ordinateur.flasherEtBrancherCleUsb(
                        'Fenetre Custom',
                        `CLEAR
RECT 25, 20, 280, 115
PRINT 45, 35, "FENETRE D'APPLICATION PERSONNALISEE"
LINE 45, 48, 285, 48
PRINT 45, 60, "Graphisme en VRAM 330x165 (5x7 Font)"
PRINT 45, 75, "Palette binaire 16 teintes operationnelle"
BEEP 440
BEEP 880
HALT`,
                        port
                      );
                      ordinateur.booterDepuisCle();
                      setInjectionSuccess(`Application flashée sur Clé USB (Port ${port}) et lancée !`);
                      onRefresh();
                      setTimeout(() => setInjectionSuccess(null), 3000);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold rounded text-[11px] font-mono shadow"
                  >
                    <Play className="w-3 h-3" />
                    <span>Flasher & Lancer</span>
                  </button>
                </div>
                <pre className="text-[11px] font-mono text-stone-300 p-2 bg-stone-950 rounded border border-stone-800">
{`CLEAR 0
RECT 25, 20, 280, 115, 3
PRINT 45, 35, "FENETRE D'APPLICATION PERSONNALISEE", 15
LINE 45, 48, 285, 48, 1
PRINT 45, 60, "Graphisme en VRAM 330x165 (5x7 Font)", 14
PRINT 45, 75, "Palette binaire 16 teintes RGB operationnelle", 6
BEEP 440
BEEP 880
HALT`}
                </pre>
              </div>

              {/* Fiche 1 : Exécuter un Code dès l'Allumage du PC (Auto-Boot) */}
              <div className="p-3.5 bg-stone-900 border border-emerald-500/30 rounded-lg space-y-2">
                <span className="text-xs font-mono text-emerald-400 font-bold uppercase flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4" />
                  1. Comment Faire Exécuter un Code dès l'Allumage du PC
                </span>
                <p className="text-xs text-stone-300">
                  Pour qu'un programme démarre automatiquement quand vous appuyez sur le bouton physique <strong>POWER ON</strong> :
                </p>
                <ol className="list-decimal list-inside text-xs font-mono space-y-1 text-stone-400 pl-1">
                  <li>Ouvrez l'Éditeur d'OS (<kbd className="text-emerald-400 font-bold">[F3]</kbd> ou via le <strong>Menu Système</strong>).</li>
                  <li>Sélectionnez <strong>Cible : Port USB 1</strong> et cliquez sur <strong>Flasher sur Clé USB</strong>.</li>
                  <li>Le BIOS VirtuArch est configuré avec <strong>AUTO-BOOT ACTIF</strong> : dès l'allumage électrique, il charge le secteur initial en RAM à l'adresse <code className="text-emerald-300">0x0000</code> et lance immédiatement l'exécution.</li>
                  <li>Au sommet de votre code source, la première instruction exécutée est la ligne 1 (point d'entrée <code className="text-emerald-300">START:</code>).</li>
                </ol>
              </div>

              {/* Fiche 2 : Créer un Espace Cliquable (Boutons Souris) */}
              <div className="p-3.5 bg-stone-900 border border-cyan-500/30 rounded-lg space-y-2">
                <span className="text-xs font-mono text-cyan-400 font-bold uppercase flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  2. Créer un Espace Cliquable (Bouton Interactif)
                </span>
                <p className="text-xs text-stone-300">
                  Un bouton est défini par un rectangle visuel et un test de collision souris :
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-2.5 bg-stone-950 rounded border border-stone-800 space-y-1">
                    <div className="text-cyan-300 font-bold">Méthode Rapide (Instruction IF_CLICK) :</div>
                    <pre className="text-[11px] text-stone-300">
{`// 1. Dessine le bouton (X=30, Y=40, W=80, H=20)
FILLRECT 30, 40, 80, 20, 2
RECT 30, 40, 80, 20, 15
PRINT 35, 46, "DEMARRER", 0

// 2. Test du clic dans la zone
BOUCLE:
  WAIT 30
  IF_CLICK 30, 40, 80, 20, MON_ACTION
  GOTO BOUCLE`}
                    </pre>
                  </div>
                  <div className="p-2.5 bg-stone-950 rounded border border-stone-800 space-y-1">
                    <div className="text-amber-300 font-bold">Méthode Bas-Niveau (Registres) :</div>
                    <pre className="text-[11px] text-stone-300">
{`MOUSE_BTN R0
IF_EQ R0, 0, PAS_DE_CLIC
MOUSE_X R1
MOUSE_Y R2
// Test boîte englobante [30..110, 40..60]
IF_LT R1, 30, PAS_DE_CLIC
IF_GT R1, 110, PAS_DE_CLIC
IF_LT R2, 40, PAS_DE_CLIC
IF_GT R2, 60, PAS_DE_CLIC
GOTO MON_ACTION`}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Fiche 3 : Détecter une Touche Clavier pour Lancer une Commande */}
              <div className="p-3.5 bg-stone-900 border border-purple-500/30 rounded-lg space-y-2">
                <span className="text-xs font-mono text-purple-400 font-bold uppercase flex items-center gap-1.5">
                  <Terminal className="w-4 h-4" />
                  3. Détecter l'Appui d'une Touche Clavier
                </span>
                <p className="text-xs text-stone-300">
                  Associez n'importe quelle touche à une action ou commande système :
                </p>
                <pre className="text-[11px] font-mono text-stone-300 p-2.5 bg-stone-950 rounded border border-stone-800">
{`// Avec l'instruction directe IF_KEY :
IF_KEY "R", REDEMARRER_PC     // Touche 'R' -> Redémarrage
IF_KEY "S", ETEINDRE_PC        // Touche 'S' -> Extinction
IF_KEY 32, SAUTER_JEU          // Touche 32 (Espace)
IF_KEY 13, VALIDER_MENU        // Touche 13 (Entrée)

// Ou en lisant le registre via GETKEY :
GETKEY R0
IF_EQ R0, 82, REDEMARRER_PC`}
                </pre>
              </div>

              {/* Fiche 4 : Groupes de Commandes en Assembleur (CALL/RET, Pile & MACROS) */}
              <div className="p-3.5 bg-stone-900 border border-blue-500/30 rounded-lg space-y-2">
                <span className="text-xs font-mono text-blue-400 font-bold uppercase flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  4. Groupes de Commandes en Assembleur (Sous-routines & Macros)
                </span>
                <p className="text-xs text-stone-300">
                  En assembleur, un groupe de commandes se structure de deux manières :
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-2.5 bg-stone-950 rounded border border-stone-800 space-y-1">
                    <div className="text-emerald-400 font-bold">1. Sous-routines (CALL et RET) :</div>
                    <p className="text-[11px] text-stone-400">
                      Exécute un bloc et revient au point d'appel grâce à la pile matérielle :
                    </p>
                    <pre className="text-[11px] text-stone-300">
{`CALL DESSINER_BOUTON
// ... suite du code ...
HALT

DESSINER_BOUTON:
  FILLRECT 20, 20, 60, 18, 8
  PRINT 24, 24, "OK", 15
  RET`}
                    </pre>
                  </div>
                  <div className="p-2.5 bg-stone-950 rounded border border-stone-800 space-y-1">
                    <div className="text-amber-400 font-bold">2. Macros (MACRO ... ENDMACRO) :</div>
                    <p className="text-[11px] text-stone-400">
                      Gabarit réutilisable avec paramètres remplacé lors de la compilation :
                    </p>
                    <pre className="text-[11px] text-stone-300">
{`MACRO BOUTON x, y, titre
  FILLRECT x, y, 70, 18, 2
  RECT x, y, 70, 18, 15
  PRINT x + 4, y + 4, titre, 0
ENDMACRO

// Utilisation :
BOUTON 30, 40, "VALIDER"
BOUTON 110, 40, "ANNULER"`}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Fiche 5 : Créer des Animations Fluides */}
              <div className="p-3.5 bg-stone-900 border border-yellow-500/30 rounded-lg space-y-2">
                <span className="text-xs font-mono text-yellow-400 font-bold uppercase flex items-center gap-1.5">
                  <Play className="w-4 h-4" />
                  5. Créer des Animations Fluides (30 FPS)
                </span>
                <p className="text-xs text-stone-300">
                  L'animation s'obtient avec une boucle <code className="text-yellow-400 font-bold">GOTO</code> cadencée par <code className="text-yellow-400 font-bold">WAIT 30</code> (30 images par seconde). À chaque trame, effacez la position précédente et dessinez la nouvelle !
                </p>
              </div>

              {/* Tableau de Référence Complet des Instructions */}
              <div className="p-3 bg-stone-900 border border-stone-800 rounded-lg space-y-3">
                <span className="text-xs font-mono text-amber-400 font-bold uppercase">
                  Tableau des Instructions Machine (VirtuScript & Assembleur)
                </span>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono border-collapse">
                    <thead>
                      <tr className="border-b border-stone-800 text-stone-400">
                        <th className="py-1 px-2">Instruction</th>
                        <th className="py-1 px-2">Opcode</th>
                        <th className="py-1 px-2">Rôle & Paramètres</th>
                        <th className="py-1 px-2">Exemple</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800/60 text-stone-300">
                      <tr>
                        <td className="py-1 px-2 text-emerald-400 font-bold">REBOOT</td>
                        <td className="py-1 px-2 text-stone-500">0x08</td>
                        <td className="py-1 px-2">Redémarre véritablement le PC virtuel</td>
                        <td className="py-1 px-2 text-stone-400">REBOOT</td>
                      </tr>
                      <tr>
                        <td className="py-1 px-2 text-rose-400 font-bold">SHUTDOWN</td>
                        <td className="py-1 px-2 text-stone-500">0x09</td>
                        <td className="py-1 px-2">Éteint physiquement l'ordinateur et l'écran</td>
                        <td className="py-1 px-2 text-stone-400">SHUTDOWN</td>
                      </tr>
                      <tr>
                        <td className="py-1 px-2 text-blue-400 font-bold">CALL label</td>
                        <td className="py-1 px-2 text-stone-500">0x1F</td>
                        <td className="py-1 px-2">Appelle une sous-routine (groupe de commandes)</td>
                        <td className="py-1 px-2 text-stone-400">CALL MON_BOUTON</td>
                      </tr>
                      <tr>
                        <td className="py-1 px-2 text-blue-400 font-bold">RET</td>
                        <td className="py-1 px-2 text-stone-500">0x20</td>
                        <td className="py-1 px-2">Retour de la sous-routine appelée par CALL</td>
                        <td className="py-1 px-2 text-stone-400">RET</td>
                      </tr>
                      <tr>
                        <td className="py-1 px-2 text-indigo-400 font-bold">PUSH / POP reg</td>
                        <td className="py-1 px-2 text-stone-500">0x21 / 0x22</td>
                        <td className="py-1 px-2">Sauvegarde ou restaure un registre sur la pile</td>
                        <td className="py-1 px-2 text-stone-400">PUSH R0 / POP R0</td>
                      </tr>
                      <tr>
                        <td className="py-1 px-2 text-cyan-400 font-bold">IF_CLICK x, y, w, h, label</td>
                        <td className="py-1 px-2 text-stone-500">0x23</td>
                        <td className="py-1 px-2">Saute si la souris clique dans la zone définie</td>
                        <td className="py-1 px-2 text-stone-400">IF_CLICK 30, 40, 80, 20, BTN</td>
                      </tr>
                      <tr>
                        <td className="py-1 px-2 text-purple-400 font-bold">IF_KEY key, label</td>
                        <td className="py-1 px-2 text-stone-500">0x24</td>
                        <td className="py-1 px-2">Saute si la touche clavier indiquée est pressée</td>
                        <td className="py-1 px-2 text-stone-400">IF_KEY "R", REDEMARRER</td>
                      </tr>
                      <tr>
                        <td className="py-1 px-2 text-yellow-400 font-bold">WAIT ms</td>
                        <td className="py-1 px-2 text-stone-500">0x07</td>
                        <td className="py-1 px-2">Cadence les animations en millisecondes</td>
                        <td className="py-1 px-2 text-stone-400">WAIT 30</td>
                      </tr>
                      <tr>
                        <td className="py-1 px-2 text-cyan-400 font-bold">FILLRECT x, y, w, h, col</td>
                        <td className="py-1 px-2 text-stone-500">0x0B</td>
                        <td className="py-1 px-2">Dessine un rectangle plein coloré RGB</td>
                        <td className="py-1 px-2 text-stone-400">FILLRECT 20, 20, 100, 40, 8</td>
                      </tr>
                      <tr>
                        <td className="py-1 px-2 text-cyan-400 font-bold">FILLCIRCLE x, y, r, col</td>
                        <td className="py-1 px-2 text-stone-500">0x0D</td>
                        <td className="py-1 px-2">Dessine un disque plein (balle animée)</td>
                        <td className="py-1 px-2 text-stone-400">FILLCIRCLE 165, 82, 10, 14</td>
                      </tr>
                      <tr>
                        <td className="py-1 px-2 text-yellow-400 font-bold">SOUND id</td>
                        <td className="py-1 px-2 text-stone-500">0x0E</td>
                        <td className="py-1 px-2">Bruitages arcade (1=Laser, 2=Saut, 3=Pièce, 4=Explo, 5=Powerup, 6=Rebond)</td>
                        <td className="py-1 px-2 text-stone-400">SOUND 6</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Exemple de Mini Jeu Arcade */}
              <div className="p-3 bg-stone-900 border border-stone-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-cyan-400 font-bold">
                    Exemple Jeu d'Arcade Balle et Palette
                  </span>
                  <button
                    onClick={() => {
                      const port = ordinateur.hubUsb.cleUsb.port || 3;
                      ordinateur.flasherEtBrancherCleUsb(
                        'Jeu Pong RGB',
                        `CLEAR 0
PRINT 90, 8, "MINI ARCADE PONG (RGB)", 14
RECT 10, 22, 310, 120, 3
FILLRECT 135, 134, 60, 6, 6
FILLCIRCLE 165, 70, 8, 14
PRINT 20, 148, "SCORE : 250   VIES : 3", 15
SOUND 1
HALT`,
                        port
                      );
                      ordinateur.booterDepuisCle();
                      setInjectionSuccess(`Jeu Arcade flashé sur Clé USB (Port ${port}) et lancé !`);
                      onRefresh();
                      setTimeout(() => setInjectionSuccess(null), 3000);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-stone-950 font-bold rounded text-[11px] font-mono shadow"
                  >
                    <Play className="w-3 h-3" />
                    <span>Flasher & Jouer</span>
                  </button>
                </div>
                <pre className="text-[11px] font-mono text-stone-300 p-2 bg-stone-950 rounded border border-stone-800">
{`CLEAR 0
PRINT 90, 8, "MINI ARCADE PONG (RGB)", 14
RECT 10, 22, 310, 120, 3
FILLRECT 135, 134, 60, 6, 6
FILLCIRCLE 165, 70, 8, 14
PRINT 20, 148, "SCORE : 250   VIES : 3", 15
SOUND 1
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
                      'BOOT_USB',
                      'ENTREE',
                      'Test Sécurité Boot USB',
                      () => {
                        ordinateur.activerAccesDisque(400, 4);
                        ordinateur.booterDepuisCle();
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

        {/* SECTION 10: VRAI BIOS ROM & BOOT USB MULTI-PORTS */}
        {sectionActive === 'bios_usb' && (
          <div className="space-y-6">
            <div className="border-b border-stone-800 pb-4">
              <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-emerald-400" />
                <span>10. Vrai BIOS ROM, Mémoire Vierge (0x0000) & Clé USB Multi-Ports (1, 2, 3)</span>
              </h3>
              <p className="text-xs text-stone-400 mt-1">
                Comprendre l'absence de système de base préchargé, le diagnostic POST et le workflow de boot personnalisé.
              </p>
            </div>

            {/* Carte 1: Philosophie Mémoire Vierge */}
            <div className="p-4 bg-stone-900 border border-stone-800 rounded-xl space-y-3 text-xs text-stone-300">
              <h4 className="font-bold text-emerald-300 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span>Initialisation Réelle : Zéro Système de Test Préchargé</span>
              </h4>
              <p>
                Sur un véritable ordinateur physique, la mémoire vive (RAM de 64 Ko, de <code className="text-emerald-300 font-mono">0x0000</code> à <code className="text-emerald-300 font-mono">0xFFFF</code>) démarre <strong>strictement vide, initialisée à zéro (<code className="text-amber-300 font-mono">0x00</code>)</strong>.
              </p>
              <ul className="list-disc list-inside space-y-1 text-stone-400">
                <li>Le système d'exploitation par défaut a été <strong>totalement supprimé du démarrage automatique</strong>.</li>
                <li>La puce <strong>ROM BIOS v2.4</strong> prend en charge le démarrage à chaud et teste tous les composants.</li>
                <li>Si aucun média de boot n'est inséré, le message authentique <strong>« NON-SYSTEM DISK OR DISK ERROR »</strong> s'affiche.</li>
              </ul>
            </div>

            {/* Carte 2: Ports USB 1, 2, 3 */}
            <div className="p-4 bg-stone-900 border border-stone-800 rounded-xl space-y-3 text-xs text-stone-300">
              <h4 className="font-bold text-amber-300 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Prise en charge de la Clé USB sur le Port 1, 2 ou 3</span>
              </h4>
              <p>
                Le contrôleur hôte USB Hub offre 3 ports matériels indépendants. La clé de stockage contenant votre système peut être insérée dans <strong>n'importe lequel des trois ports</strong> :
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 font-mono text-[11px]">
                <div className="p-2.5 bg-stone-950 border border-stone-800 rounded">
                  <div className="font-bold text-emerald-400">Port USB 1</div>
                  <div className="text-stone-400">Clavier ou Clé USB Bootable</div>
                </div>
                <div className="p-2.5 bg-stone-950 border border-stone-800 rounded">
                  <div className="font-bold text-cyan-400">Port USB 2</div>
                  <div className="text-stone-400">Souris ou Clé USB Bootable</div>
                </div>
                <div className="p-2.5 bg-stone-950 border border-stone-800 rounded">
                  <div className="font-bold text-amber-400">Port USB 3</div>
                  <div className="text-stone-400">Port Flash dédié ou Clé USB Bootable</div>
                </div>
              </div>
            </div>

            {/* Carte 3: Tutoriel pas à pas */}
            <div className="p-4 bg-stone-900 border border-stone-800 rounded-xl space-y-3 text-xs">
              <h4 className="font-bold text-cyan-300 flex items-center gap-2">
                <Play className="w-4 h-4 text-cyan-400" />
                <span>Procédure pour Créer et Lancer votre Propre Système :</span>
              </h4>
              <ol className="list-decimal list-inside space-y-1.5 text-stone-300">
                <li>Ouvrez l'<strong>Éditeur de Système d'Exploitation & Flasheur Clé USB</strong> (Bouton dans la barre supérieure ou touche <code className="text-emerald-300 font-mono">[F3]</code>).</li>
                <li>Rédigez votre code source (instructions graphiques ou assembleur).</li>
                <li>Cliquez sur <strong>« 1. Flasher sur la Clé USB »</strong> et choisissez le port d'insertion (Port 1, 2 ou 3).</li>
                <li>Le BIOS détecte immédiatement le média et vous invite à presser <code className="text-emerald-300 font-mono">[ENTRÉE]</code>.</li>
                <li>Le moteur pas-à-pas émet son bruit de lecture (<code className="text-amber-300 font-mono">chhk-chhk-krrr</code>), les octets sont chargés à <code className="text-emerald-300 font-mono">0x0000</code> et votre système s'exécute !</li>
              </ol>
            </div>

            {/* Carte 4: Périphériques, Animations & Clavier F1..F12 */}
            <div className="p-4 bg-stone-900 border border-stone-800 rounded-xl space-y-3 text-xs">
              <h4 className="font-bold text-emerald-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Périphériques Réalistes & Animations Hardware :</span>
              </h4>
              <ul className="list-disc list-inside space-y-1.5 text-stone-300">
                <li><strong>Curseur Souris Matériel (Overlay DAC) :</strong> Le curseur est superposé en direct sur le signal vidéo au niveau du moniteur sans altérer la mémoire VRAM, éliminant tout artefact ou résidu de traînée lors des déplacements.</li>
                <li><strong>Animations & Graphismes pilotés par Registres :</strong> Les commandes <code className="text-cyan-300 font-mono">FILLCIRCLE R0, R1, 6, 11</code>, <code className="text-cyan-300 font-mono">RECT</code>, <code className="text-cyan-300 font-mono">ADD R0, R2</code> évaluent les registres en temps réel pour une fluidité à 30 images/seconde avec rebonds physiques.</li>
                <li><strong>Rangée de Touches de Fonction [F1] à [F12] :</strong> Accès direct au BIOS Setup (<code className="text-emerald-300 font-mono">[F2]</code>), à l'Éditeur d'OS (<code className="text-emerald-300 font-mono">[F3]</code>), et à toutes les touches programmables dans vos applications avec <code className="text-emerald-300 font-mono">IF_KEY "F1", LABEL</code>.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

