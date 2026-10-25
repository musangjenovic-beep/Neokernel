import { Instruction } from '../types/virtualComputer';

export interface OsPreset {
  id: string;
  name: string;
  category: 'OS' | 'DBD' | 'Graphique' | 'Matériel' | 'Vierge';
  tagline: string;
  description: string;
  instructions: Instruction[];
  defaultMemorySetup?: { addr: number; val: number }[];
}

export const OS_PRESETS: OsPreset[] = [
  {
    id: 'hello_world',
    name: 'Hello World (Premier Programme)',
    category: 'OS',
    tagline: 'Code séquentiel simple qui affiche "HELLO WORLD" sur l\'écran pixel',
    description:
      'Le programme le plus simple et direct : il efface l\'écran en bleu nuit, trace un encadrement décoratif, puis écrit "HELLO" en Cyan et "WORLD" en Jaune avec un curseur console.',
    instructions: [
      { op: 'CLEAR_SCREEN', val: 1, comment: '1. Efface l\'écran en bleu nuit (palette 1)' },
      
      // Tracer bordure supérieure et inférieure (X = 3..28)
      { op: 'MOV', dst: 'R0', src: 3, comment: 'X = 3' },
      { label: 'CADRE', op: 'DRAW_PIXEL', dst: 'R0', src: '5', val: 5, comment: 'Ligne supérieure Y=5' },
      { op: 'DRAW_PIXEL', dst: 'R0', src: '26', val: 5, comment: 'Ligne inférieure Y=26' },
      { op: 'INC', dst: 'R0', comment: 'X++' },
      { op: 'CMP', dst: 'R0', src: 29, comment: 'Fin de ligne ?' },
      { op: 'JL', addr: 2, label: 'CADRE', comment: 'Boucle bordure' },

      // Écriture de "HELLO" au centre (X=6, Y=10) en Cyan éclatant (Couleur 12)
      { op: 'DRAW_TEXT', text: 'HELLO', dst: 6, addr: 10, val: 12, comment: 'Affiche HELLO à (6, 10) en Cyan' },

      // Écriture de "WORLD" sur la seconde ligne (X=6, Y=18) en Jaune chaud (Couleur 10)
      { op: 'DRAW_TEXT', text: 'WORLD', dst: 6, addr: 18, val: 10, comment: 'Affiche WORLD à (6, 18) en Jaune' },

      // Curseur interactif blanc au bas de l'écran (X=6, Y=24)
      { op: 'DRAW_PIXEL', dst: '6', src: '24', val: 7, comment: 'Curseur console blanc' },
      { op: 'DRAW_PIXEL', dst: '7', src: '24', val: 7 },
      { op: 'DRAW_PIXEL', dst: '8', src: '24', val: 7 },

      // Fin d'exécution
      { op: 'HALT', comment: 'Arrêt processeur : Affichage terminé !' },
    ],
  },
  {
    id: 'nano_os',
    name: 'NanoOS v1.0 (Système d\'Exploitation)',
    category: 'OS',
    tagline: 'Noyau monolithique avec gestion des interruptions, pilote clavier et écran pixel',
    description:
      'Un véritable système d\'exploitation minimaliste. Il configure la table des vecteurs d\'interruption (IVT), initialise la pile d\'exécution, active les interruptions matérielles (STI), efface l\'écran, affiche une barre d\'état et capture les frappes clavier (IRQ1) et le timer système (IRQ0).',
    defaultMemorySetup: [
      { addr: 0x0001, val: 0x0095 }, // Vector 1 (Timer IRQ0) -> ISR_TIMER (line ~21)
      { addr: 0x0002, val: 0x00a0 }, // Vector 2 (Keyboard IRQ1) -> ISR_KEYBOARD (line ~32)
      { addr: 0x0280, val: 0 },      // Uptime tick counter
      { addr: 0x0281, val: 2 },      // Cursor X
      { addr: 0x0282, val: 6 },      // Cursor Y
    ],
    instructions: [
      // --- Bootloader & Kernel Init (0x0080) ---
      { op: 'MOV', dst: 'SP', src: 0x03bf, comment: 'Initialise la pile (Stack)' },
      { op: 'CLEAR_SCREEN', val: 0, comment: 'Efface l\'écran en noir' },
      
      // Tracer barre de titre en bleu (y=0..2)
      { op: 'MOV', dst: 'R0', src: 0, comment: 'X = 0' },
      { op: 'MOV', dst: 'R1', src: 1, comment: 'Y = 1' },
      { op: 'MOV', dst: 'R2', src: 12, comment: 'Couleur Cyan' },
      { label: 'DRAW_HEADER', op: 'DRAW_PIXEL', dst: 'R0', src: 'R1', val: 12, comment: 'Pixel titre' },
      { op: 'INC', dst: 'R0', comment: 'X++' },
      { op: 'CMP', dst: 'R0', src: 32, comment: 'Bord droit ?' },
      { op: 'JL', addr: 3, label: 'DRAW_HEADER', comment: 'Boucle ligne titre' },

      // Tracer bordure inférieure
      { op: 'MOV', dst: 'R0', src: 0 },
      { op: 'MOV', dst: 'R1', src: 30 },
      { label: 'DRAW_FOOTER', op: 'DRAW_PIXEL', dst: 'R0', src: 'R1', val: 5 },
      { op: 'INC', dst: 'R0' },
      { op: 'CMP', dst: 'R0', src: 32 },
      { op: 'JL', addr: 8, label: 'DRAW_FOOTER' },

      // Activer les interruptions matérielles
      { op: 'STI', comment: 'Active les interruptions CPU' },
      
      // Boucle principale du noyau (Idle Loop)
      { label: 'KERNEL_IDLE', op: 'NOP', comment: 'Attente d\'événements (Idle)' },
      { op: 'JMP', addr: 14, label: 'KERNEL_IDLE', comment: 'Boucle infinie' },

      // --- ISR_TIMER (Vecteur 1 : Horloge matérielle IRQ0) ---
      { label: 'ISR_TIMER', op: 'LOAD', dst: 'R0', addr: 0x0280, comment: 'Charge compteur tick' },
      { op: 'INC', dst: 'R0', comment: 'Tick++' },
      { op: 'STORE', addr: 0x0280, src: 'R0', comment: 'Sauvegarde compteur' },
      // Allumer le pixel battement de cœur en haut à droite (31, 1)
      { op: 'AND', dst: 'R0', src: 1, comment: 'Parité tick' },
      { op: 'CMP', dst: 'R0', src: 0 },
      { op: 'JZ', addr: 26, label: 'TICK_EVEN' },
      { op: 'DRAW_PIXEL', dst: '31', src: '1', val: 11, comment: 'Cœur vert actif' },
      { op: 'JMP', addr: 27, label: 'TICK_END' },
      { label: 'TICK_EVEN', op: 'DRAW_PIXEL', dst: '31', src: '1', val: 1, comment: 'Cœur éteint' },
      { label: 'TICK_END', op: 'RTI', comment: 'Fin interruption Timer' },

      // --- ISR_KEYBOARD (Vecteur 2 : Interruption Clavier IRQ1) ---
      { label: 'ISR_KEYBOARD', op: 'IN', dst: 'R0', port: 4, comment: 'Lit port clavier (ASCII)' },
      { op: 'LOAD', dst: 'R1', addr: 0x0281, comment: 'Charge Curseur X' },
      { op: 'LOAD', dst: 'R2', addr: 0x0282, comment: 'Charge Curseur Y' },
      // Choisir une couleur vive basée sur la touche
      { op: 'MOV', dst: 'R3', src: 'R0' },
      { op: 'MOD', dst: 'R3', src: 7 },
      { op: 'ADD', dst: 'R3', src: 8, comment: 'Couleur 8..14' },
      { op: 'DRAW_PIXEL', dst: 'R1', src: 'R2', val: 14, comment: 'Affiche pixel touche' },
      { op: 'INC', dst: 'R1', comment: 'Curseur X++' },
      { op: 'CMP', dst: 'R1', src: 30, comment: 'Bord droit atteint ?' },
      { op: 'JL', addr: 40, label: 'KB_SAVE' },
      { op: 'MOV', dst: 'R1', src: 2, comment: 'Retour chariot' },
      { op: 'INC', dst: 'R2', comment: 'Ligne suivante' },
      { label: 'KB_SAVE', op: 'STORE', addr: 0x0281, src: 'R1' },
      { op: 'STORE', addr: 0x0282, src: 'R2' },
      { op: 'RTI', comment: 'Fin interruption Clavier' },
    ],
  },
  {
    id: 'dbd_engine',
    name: 'Moteur Index DBD (Base de Données en RAM)',
    category: 'DBD',
    tagline: 'Index B-Tree en mémoire vive : insertions, recherche binaire rapide et pointeurs',
    description:
      'Illustre l\'utilisation directe de la mémoire vive comme index DBD avec une structure arborescente optimisée en RAM (adresse 0x01C0). Le programme insère des clés (105, 240, 310, 420...) pointant vers des enregistrements, puis effectue des requêtes ultra-rapides O(log N) et affiche les statistiques d\'accès.',
    defaultMemorySetup: [
      // Enregistrements de données dans le segment données (0x0280..0x02A0)
      { addr: 0x0280, val: 1200 }, // Record Alice (Solde / Valeur)
      { addr: 0x0284, val: 3400 }, // Record Bob
      { addr: 0x0288, val: 5600 }, // Record Charlie
      { addr: 0x028c, val: 7800 }, // Record David
      { addr: 0x0290, val: 9900 }, // Record Eva
    ],
    instructions: [
      { op: 'CLEAR_SCREEN', val: 0, comment: 'Nettoie l\'écran' },

      // 1. Insertion de clés dans l'Index DBD en RAM
      { op: 'DBD_SET', val: 240, addr: 0x0284, comment: 'Insère clé 240 -> Ptr 0x0284 (Bob)' },
      { op: 'DBD_SET', val: 105, addr: 0x0280, comment: 'Insère clé 105 -> Ptr 0x0280 (Alice)' },
      { op: 'DBD_SET', val: 420, addr: 0x028c, comment: 'Insère clé 420 -> Ptr 0x028C (David)' },
      { op: 'DBD_SET', val: 310, addr: 0x0288, comment: 'Insère clé 310 -> Ptr 0x0288 (Charlie)' },
      { op: 'DBD_SET', val: 512, addr: 0x0290, comment: 'Insère clé 512 -> Ptr 0x0290 (Eva)' },

      // 2. Recherche indexée rapide de la clé 310
      { op: 'DBD_GET', dst: 'R0', val: 310, comment: 'R0 = Recherche clé 310' },
      // R0 contient maintenant le pointeur mémoire 0x0288 !
      { op: 'LOAD', dst: 'R1', src: 'R0', comment: 'R1 = Lit la valeur pointée (5600)' },

      // 3. Dessiner un graphe d'accès sur l'écran
      { op: 'MOV', dst: 'R2', src: 2, comment: 'X = 2' },
      { op: 'MOV', dst: 'R3', src: 10, comment: 'Y = 10' },
      { label: 'DRAW_BAR', op: 'DRAW_PIXEL', dst: 'R2', src: 'R3', val: 10, comment: 'Pixel vert barre' },
      { op: 'INC', dst: 'R2' },
      { op: 'CMP', dst: 'R2', src: 22 },
      { op: 'JL', addr: 9, label: 'DRAW_BAR' },

      // Succès recherche
      { op: 'DRAW_PIXEL', dst: '2', src: '12', val: 11, comment: 'Statut OK (vert)' },
      { op: 'DRAW_PIXEL', dst: '4', src: '12', val: 11 },
      { op: 'DRAW_PIXEL', dst: '6', src: '12', val: 11 },

      { op: 'HALT', comment: 'Indexation & Recherche terminées' },
    ],
  },
  {
    id: 'pixel_game',
    name: 'Animation Graphique & Écran Pixel',
    category: 'Graphique',
    tagline: 'Moteur de rendu 32x32 pixels, particule animée et contrôle interactif',
    description:
      'Démontre le dessin matériel direct dans la mémoire VRAM et les ports d\'entrée/sortie (Port 0: X, Port 1: Y, Port 2: Couleur). Une particule rebondit sur les bordures virtuelles et réagit aux touches fléchées ou ZQSD.',
    instructions: [
      { op: 'CLEAR_SCREEN', val: 0, comment: 'Efface l\'écran' },

      // Tracer les 4 murs d'enceinte
      { op: 'MOV', dst: 'R0', src: 0 },
      { label: 'DRAW_WALL', op: 'DRAW_PIXEL', dst: 'R0', src: '0', val: 6, comment: 'Mur haut' },
      { op: 'DRAW_PIXEL', dst: 'R0', src: '31', val: 6, comment: 'Mur bas' },
      { op: 'DRAW_PIXEL', dst: '0', src: 'R0', val: 6, comment: 'Mur gauche' },
      { op: 'DRAW_PIXEL', dst: '31', src: 'R0', val: 6, comment: 'Mur droit' },
      { op: 'INC', dst: 'R0' },
      { op: 'CMP', dst: 'R0', src: 32 },
      { op: 'JL', addr: 1, label: 'DRAW_WALL' },

      // Position de la particule (X=R0, Y=R1, DX=R2, DY=R3)
      { op: 'MOV', dst: 'R0', src: 16, comment: 'X = 16' },
      { op: 'MOV', dst: 'R1', src: 16, comment: 'Y = 16' },
      { op: 'MOV', dst: 'R2', src: 1, comment: 'DX = +1' },
      { op: 'MOV', dst: 'R3', src: 1, comment: 'DY = +1' },

      // Boucle d'animation
      { label: 'GAME_LOOP', op: 'DRAW_PIXEL', dst: 'R0', src: 'R1', val: 0, comment: 'Efface ancien pixel' },

      // Mise à jour X
      { op: 'ADD', dst: 'R0', src: 'R2', comment: 'X += DX' },
      { op: 'CMP', dst: 'R0', src: 30 },
      { op: 'JL', addr: 17, label: 'CHECK_LEFT' },
      { op: 'MOV', dst: 'R2', src: -1, comment: 'Rebond droite' },
      { label: 'CHECK_LEFT', op: 'CMP', dst: 'R0', src: 1 },
      { op: 'JG', addr: 19, label: 'CHECK_Y' },
      { op: 'MOV', dst: 'R2', src: 1, comment: 'Rebond gauche' },

      // Mise à jour Y
      { label: 'CHECK_Y', op: 'ADD', dst: 'R1', src: 'R3', comment: 'Y += DY' },
      { op: 'CMP', dst: 'R1', src: 30 },
      { op: 'JL', addr: 23, label: 'CHECK_TOP' },
      { op: 'MOV', dst: 'R3', src: -1, comment: 'Rebond bas' },
      { label: 'CHECK_TOP', op: 'CMP', dst: 'R1', src: 1 },
      { op: 'JG', addr: 25, label: 'DRAW_NEW' },
      { op: 'MOV', dst: 'R3', src: 1, comment: 'Rebond haut' },

      // Dessiner nouvelle particule
      { label: 'DRAW_NEW', op: 'DRAW_PIXEL', dst: 'R0', src: 'R1', val: 9, comment: 'Dessine pixel orange' },
      { op: 'JMP', addr: 12, label: 'GAME_LOOP', comment: 'Prochaine trame' },
    ],
  },
  {
    id: 'interrupt_demo',
    name: 'Démonstrateur d\'Interruptions Préemptives',
    category: 'Matériel',
    tagline: 'Multitâche préemptif : l\'horloge matérielle interrompt le calcul de Fibonacci',
    description:
      'Démontre le mécanisme matériel fondamental d\'interruption : le CPU exécute une boucle de calcul en tâche de fond, tandis que le contrôleur d\'interruptions force le saut vers la routine ISR à chaque impulsion du timer, sans altérer les registres de calcul grâce à la pile d\'exécution.',
    defaultMemorySetup: [
      { addr: 0x0001, val: 0x0090 }, // Vector 1 -> Timer ISR (line 16)
      { addr: 0x0280, val: 0 },      // Counter ISR
    ],
    instructions: [
      { op: 'MOV', dst: 'SP', src: 0x03bf, comment: 'Init pile' },
      { op: 'CLEAR_SCREEN', val: 0 },
      { op: 'STI', comment: 'Autorise les interruptions' },

      // Calcul continu de Fibonacci en tâche de fond
      { op: 'MOV', dst: 'R0', src: 0, comment: 'Fib_A = 0' },
      { op: 'MOV', dst: 'R1', src: 1, comment: 'Fib_B = 1' },
      { label: 'CALC_LOOP', op: 'MOV', dst: 'A', src: 'R0' },
      { op: 'ADD', dst: 'A', src: 'R1', comment: 'A = Fib_A + Fib_B' },
      { op: 'MOV', dst: 'R0', src: 'R1' },
      { op: 'MOV', dst: 'R1', src: 'A' },
      { op: 'CMP', dst: 'R1', src: 10000, comment: 'Remise à zéro si trop grand' },
      { op: 'JL', addr: 13, label: 'NO_OVERFLOW' },
      { op: 'MOV', dst: 'R0', src: 0 },
      { label: 'NO_OVERFLOW', op: 'JMP', addr: 5, comment: 'Recommence calcul' },

      // --- ISR_TIMER (à l'adresse 0x0090) ---
      { label: 'ISR_TIMER_DEMO', op: 'PUSH', dst: 'R0', comment: 'Sauvegarde R0 sur pile' },
      { op: 'LOAD', dst: 'R0', addr: 0x0280, comment: 'Compteur ticks' },
      { op: 'INC', dst: 'R0' },
      { op: 'STORE', addr: 0x0280, src: 'R0' },
      { op: 'MOD', dst: 'R0', src: 32 },
      { op: 'DRAW_PIXEL', dst: 'R0', src: '5', val: 12, comment: 'Affiche jalon cyan' },
      { op: 'POP', dst: 'R0', comment: 'Restaure R0 depuis pile' },
      { op: 'RTI', comment: 'Retour d\'interruption' },
    ],
  },
  {
    id: 'bare_metal',
    name: 'Noyau Vierge (Créer son OS de zéro)',
    category: 'Vierge',
    tagline: 'Feuille blanche avec vecteurs d\'interruption prêts à être programmés',
    description:
      'Modèle propre et documenté pour concevoir votre propre système d\'exploitation bas niveau. Vous pouvez programmer directement vos routines en JSON ou en Assembleur, définir vos pilotes d\'E/S et votre gestionnaire de mémoire.',
    defaultMemorySetup: [
      { addr: 0x0001, val: 0x008a }, // IRQ0 -> Line 10
      { addr: 0x0002, val: 0x008c }, // IRQ1 -> Line 12
    ],
    instructions: [
      { op: 'MOV', dst: 'SP', src: 0x03bf, comment: '1. Initialiser la pile' },
      { op: 'CLEAR_SCREEN', val: 1, comment: '2. Nettoyer l\'écran en bleu nuit' },
      { op: 'STI', comment: '3. Activer les interruptions' },
      
      // Votre code OS commence ici
      { op: 'MOV', dst: 'R0', src: 15, comment: 'Exemple : X = 15' },
      { op: 'MOV', dst: 'R1', src: 15, comment: 'Y = 15' },
      { op: 'DRAW_PIXEL', dst: 'R0', src: 'R1', val: 7, comment: 'Pixel blanc au centre' },

      { label: 'MON_OS_BOUCLE', op: 'NOP', comment: 'Votre boucle système' },
      { op: 'JMP', addr: 6, label: 'MON_OS_BOUCLE' },

      // Gestionnaire Timer
      { label: 'MON_ISR_TIMER', op: 'RTI', comment: 'Votre code d\'interruption Timer' },

      // Gestionnaire Clavier
      { label: 'MON_ISR_CLAVIER', op: 'IN', dst: 'R0', port: 4, comment: 'Lit touche clavier' },
      { op: 'RTI', comment: 'Votre code d\'interruption Clavier' },
    ],
  },
];
