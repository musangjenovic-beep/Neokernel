/**
 * Studio de Construction de Langages de Programmation & Créateur d'Applications
 * Permet de définir les règles d'un langage, compiler en bytecode binaire (0bXXXXXXXX)
 * et exécuter l'application créée directement sur le PC virtuel (330x165 en RGB 16 couleurs).
 */

export interface RegleSyntaxe {
  nom: string;
  motCle: string;
  opcodeBinaire: string; // Ex: "0b00000001"
  description: string;
  exemple?: string;
}

export interface ProgrammeCompileBinaire {
  nomApplication: string;
  sourceCode: string;
  bytecodeBinaire: string[]; // Liste d'octets binaires "0bXXXXXXXX"
  octets: number[];
  symboles: Record<string, number>;
  logsCompilation: string[];
  succes: boolean;
}

export const OPCODES = {
  PRINT: 0x01,       // 0b00000001: PRINT x, y, len, string, col
  PIXEL: 0x02,       // 0b00000010: PIXEL x, y, col
  RECT: 0x03,        // 0b00000011: RECT x, y, w, h, col
  LINE: 0x04,        // 0b00000100: LINE x0, y0, x1, y1, col
  CLEAR: 0x05,       // 0b00000101: CLEAR col
  BEEP: 0x06,        // 0b00000110: BEEP freqMsb, freqLsb, dur
  WAIT: 0x07,        // 0b00000111: WAIT ms
  REBOOT: 0x08,      // 0b00001000: REBOOT (Redémarrage matériel de l'ordinateur)
  SHUTDOWN: 0x09,    // 0b00001001: SHUTDOWN (Extinction complète du PC virtuel)
  COLOR: 0x0A,       // 0b00001010: COLOR col (Définit la couleur RGB active 0..15)
  FILLRECT: 0x0B,    // 0b00001011: FILLRECT x, y, w, h, col (Rectangle plein)
  CIRCLE: 0x0C,      // 0b00001100: CIRCLE xc, yc, r, col (Cercle contour)
  FILLCIRCLE: 0x0D,  // 0b00001101: FILLCIRCLE xc, yc, r, col (Disque plein)
  SOUND: 0x0E,       // 0b00001110: SOUND fx_id (1=Laser, 2=Saut, 3=Pièce, 4=Explosion, 5=Powerup, 6=Rebond)
  HALT: 0x0F,        // 0b00001111: HALT (Fin du programme)
  SET: 0x10,         // 0b00010000: SET reg, val
  ADD: 0x11,         // 0b00010001: ADD reg, val
  SUB: 0x12,         // 0b00010010: SUB reg, val
  RANDOM: 0x13,      // 0b00010011: RANDOM reg, min, max
  GOTO: 0x14,        // 0b00010100: GOTO addrMsb, addrLsb
  IF_EQ: 0x15,       // 0b00010101: IF reg == val GOTO addr
  IF_NE: 0x16,       // 0b00010110: IF reg != val GOTO addr
  IF_LT: 0x17,       // 0b00010111: IF reg < val GOTO addr
  IF_GT: 0x18,       // 0b00011000: IF reg > val GOTO addr
  GETKEY: 0x19,      // 0b00011001: GETKEY reg (Lit le code ASCII touche)
  MOUSE_X: 0x1A,     // 0b00011010: MOUSE_X reg (Lit position X souris)
  MOUSE_Y: 0x1B,     // 0b00011011: MOUSE_Y reg (Lit position Y souris)
  MOUSE_BTN: 0x1C,   // 0b00011100: MOUSE_BTN reg (Lit boutons souris)
  POKE: 0x1D,        // 0b00011101: POKE addrMsb, addrLsb, val
  PEEK: 0x1E,        // 0b00011110: PEEK addrMsb, addrLsb, reg
  CALL: 0x1F,        // 0b00011111: CALL addrMsb, addrLsb (Appel de sous-routine / procédure)
  RET: 0x20,         // 0b00100000: RET (Retour de sous-routine)
  PUSH: 0x21,        // 0b00100001: PUSH reg (Empile registre sur la pile)
  POP: 0x22,         // 0b00100010: POP reg (Dépile sommet de pile vers registre)
  IF_CLICK: 0x23,    // 0b00100011: IF_CLICK x, y, w, h, addrMsb, addrLsb (Saut si clic souris dans la zone)
  IF_KEY: 0x24,      // 0b00100100: IF_KEY asciiCode, addrMsb, addrLsb (Saut si touche pressée)
};

export class LanguageStudio {
  public nomLangage: string = 'VirtuScript OS/Game v2.5';
  public regles: RegleSyntaxe[] = [
    { nom: 'AFFICHER', motCle: 'PRINT', opcodeBinaire: '0b00000001', description: 'Affiche un texte aux coordonnées X, Y (avec couleur optionnelle)', exemple: 'PRINT 10, 10, "HELLO", 4' },
    { nom: 'DESSINER_PIXEL', motCle: 'PIXEL', opcodeBinaire: '0b00000010', description: 'Allume un pixel RGB aux coordonnées (X, Y)', exemple: 'PIXEL 100, 80, 6' },
    { nom: 'RECTANGLE', motCle: 'RECT', opcodeBinaire: '0b00000011', description: 'Trace le contour d\'un rectangle (X, Y, Largeur, Hauteur, [Couleur])', exemple: 'RECT 20, 20, 120, 50, 3' },
    { nom: 'RECTANGLE_PLEIN', motCle: 'FILLRECT', opcodeBinaire: '0b00001011', description: 'Dessine un rectangle plein rempli de couleur (X, Y, W, H, [Couleur])', exemple: 'FILLRECT 30, 30, 80, 40, 8' },
    { nom: 'CERCLE', motCle: 'CIRCLE', opcodeBinaire: '0b00001100', description: 'Trace le contour d\'un cercle (X, Y, Rayon, [Couleur])', exemple: 'CIRCLE 165, 82, 35, 7' },
    { nom: 'CERCLE_PLEIN', motCle: 'FILLCIRCLE', opcodeBinaire: '0b00001101', description: 'Dessine un disque plein (X, Y, Rayon, [Couleur])', exemple: 'FILLCIRCLE 165, 82, 20, 14' },
    { nom: 'LIGNE', motCle: 'LINE', opcodeBinaire: '0b00000100', description: 'Trace une ligne binaire entre (X1, Y1) et (X2, Y2, [Couleur])', exemple: 'LINE 10, 10, 320, 150, 1' },
    { nom: 'EFFACER', motCle: 'CLEAR', opcodeBinaire: '0b00000101', description: 'Efface l\'écran avec une couleur RGB de fond optionnelle', exemple: 'CLEAR 0' },
    { nom: 'COULEUR', motCle: 'COLOR', opcodeBinaire: '0b00001010', description: 'Définit la couleur RGB active par défaut (0..15)', exemple: 'COLOR 3' },
    { nom: 'SON_BIP', motCle: 'BEEP', opcodeBinaire: '0b00000110', description: 'Émet un bip audio avec fréquence en Hz', exemple: 'BEEP 440' },
    { nom: 'EFFET_SONORE', motCle: 'SOUND', opcodeBinaire: '0b00001110', description: 'Joue un effet sonore (1=Laser, 2=Saut, 3=Pièce, 4=Explosion, 5=Powerup, 6=Rebond)', exemple: 'SOUND 3' },
    { nom: 'PAUSE_ANIMATION', motCle: 'WAIT', opcodeBinaire: '0b00000111', description: 'Pause temporelle en millisecondes pour synchroniser les animations', exemple: 'WAIT 30' },
    { nom: 'REDEMARRER', motCle: 'REBOOT', opcodeBinaire: '0b00001000', description: 'Redémarre véritablement l\'ordinateur virtuel (Reset matériel OS)', exemple: 'REBOOT' },
    { nom: 'ETEINDRE', motCle: 'SHUTDOWN', opcodeBinaire: '0b00001001', description: 'Éteint complètement l\'ordinateur virtuel et l\'écran (Power Off)', exemple: 'SHUTDOWN' },
    { nom: 'APPEL_PROCEDURE', motCle: 'CALL', opcodeBinaire: '0b00011111', description: 'Groupe de commandes : appelle une sous-routine avec sauvegarde de retour', exemple: 'CALL MON_BOUTON' },
    { nom: 'RETOUR_PROCEDURE', motCle: 'RET', opcodeBinaire: '0b00100000', description: 'Groupe de commandes : retourne de la sous-routine appelée par CALL', exemple: 'RET' },
    { nom: 'EMPILLER', motCle: 'PUSH', opcodeBinaire: '0b00100001', description: 'Sauvegarde la valeur d\'un registre sur la pile d\'exécution', exemple: 'PUSH R0' },
    { nom: 'DEPILLER', motCle: 'POP', opcodeBinaire: '0b00100010', description: 'Récupère la valeur du sommet de la pile vers un registre', exemple: 'POP R0' },
    { nom: 'BOUTON_CLIC', motCle: 'IF_CLICK', opcodeBinaire: '0b00100011', description: 'Zone cliquable : saute vers une étiquette si clic dans (x, y, w, h)', exemple: 'IF_CLICK 30, 40, 80, 20, ACTION_BTN' },
    { nom: 'TOUCHE_PRESS', motCle: 'IF_KEY', opcodeBinaire: '0b00100100', description: 'Touche clavier : saute vers une étiquette si la touche est pressée', exemple: 'IF_KEY "R", REDEMARRER' },
    { nom: 'AFFECTER_REG', motCle: 'SET', opcodeBinaire: '0b00010000', description: 'Affecte une valeur à un registre (R0 à R7)', exemple: 'SET R0, 42' },
    { nom: 'ADDITION', motCle: 'ADD', opcodeBinaire: '0b00010001', description: 'Additionne une valeur à un registre', exemple: 'ADD R0, 5' },
    { nom: 'SOUSTRACTION', motCle: 'SUB', opcodeBinaire: '0b00010010', description: 'Soustrait une valeur à un registre', exemple: 'SUB R0, 1' },
    { nom: 'ALEATOIRE', motCle: 'RANDOM', opcodeBinaire: '0b00010011', description: 'Génère un nombre aléatoire entre Min et Max dans un registre', exemple: 'RANDOM R1, 10, 150' },
    { nom: 'SAUT', motCle: 'GOTO', opcodeBinaire: '0b00010100', description: 'Saut inconditionnel vers une étiquette', exemple: 'GOTO BOUCLE' },
    { nom: 'COND_EGAL', motCle: 'IF_EQ', opcodeBinaire: '0b00010101', description: 'Saut si registre == valeur (IF_EQ reg, val, label)', exemple: 'IF_EQ R0, 10, FIN' },
    { nom: 'COND_DIFF', motCle: 'IF_NE', opcodeBinaire: '0b00010110', description: 'Saut si registre != valeur (IF_NE reg, val, label)', exemple: 'IF_NE R0, 0, BOUCLE' },
    { nom: 'COND_INF', motCle: 'IF_LT', opcodeBinaire: '0b00010111', description: 'Saut si registre < valeur (IF_LT reg, val, label)', exemple: 'IF_LT R0, 100, REBOND' },
    { nom: 'COND_SUP', motCle: 'IF_GT', opcodeBinaire: '0b00011000', description: 'Saut si registre > valeur (IF_GT reg, val, label)', exemple: 'IF_GT R0, 200, INVERSER' },
    { nom: 'LIT_TOUCHE', motCle: 'GETKEY', opcodeBinaire: '0b00011001', description: 'Lit le code ASCII de la touche clavier dans un registre', exemple: 'GETKEY R2' },
    { nom: 'SOURIS_X', motCle: 'MOUSE_X', opcodeBinaire: '0b00011010', description: 'Lit la position X de la souris dans un registre', exemple: 'MOUSE_X R3' },
    { nom: 'SOURIS_Y', motCle: 'MOUSE_Y', opcodeBinaire: '0b00011011', description: 'Lit la position Y de la souris dans un registre', exemple: 'MOUSE_Y R4' },
    { nom: 'SOURIS_BTN', motCle: 'MOUSE_BTN', opcodeBinaire: '0b00011100', description: 'Lit l\'état des clics de souris (1=Gauche, 2=Droit, 3=Deux)', exemple: 'MOUSE_BTN R5' },
    { nom: 'ECRIRE_RAM', motCle: 'POKE', opcodeBinaire: '0b00011101', description: 'Écrit un octet en mémoire RAM physique (POKE adresse, valeur)', exemple: 'POKE 256, 255' },
    { nom: 'LIRE_RAM', motCle: 'PEEK', opcodeBinaire: '0b00011110', description: 'Lit un octet de la RAM vers un registre (PEEK adresse, registre)', exemple: 'PEEK 256, R0' },
    { nom: 'ARRET', motCle: 'HALT', opcodeBinaire: '0b00001111', description: 'Termine l\'exécution du programme', exemple: 'HALT' },
  ];

  public modelesProgrammes: { nom: string; code: string; desc: string }[] = [
    {
      nom: 'Système OS Fenêtré avec Boutons Cliquables & Sons (CALL/RET)',
      desc: 'OS interactif complet avec barre des tâches, sous-routines CALL/RET, boutons cliquables à la souris et raccourcis clavier',
      code: `// ============================================
// SYSTEME D'EXPLOITATION VIRTUEL INTERACTIF (OS 330x165)
// ============================================
CLEAR 0
COLOR 3

// 1. Appel de la sous-routine pour dessiner le bureau
CALL DESSINER_BUREAU
CALL DESSINER_FENETRE
CALL DESSINER_TOUS_LES_BOUTONS
SOUND 5

// 2. Boucle Principale Interactive d'Événements
BOUCLE_EVENEMENTS:
  WAIT 30

  // Détection des clics sur les espaces de boutons
  IF_CLICK 35, 105, 75, 20, CLIC_BOUTON_AUDIO
  IF_CLICK 120, 105, 85, 20, CLIC_BOUTON_REBOOT
  IF_CLICK 215, 105, 85, 20, CLIC_BOUTON_SHUTDOWN

  // Détection des touches clavier raccourcis
  IF_KEY "1", CLIC_BOUTON_AUDIO
  IF_KEY "R", CLIC_BOUTON_REBOOT
  IF_KEY "S", CLIC_BOUTON_SHUTDOWN

  GOTO BOUCLE_EVENEMENTS

// --------------------------------------------
// ACTIONS DES BOUTONS CLIQUABLES
// --------------------------------------------
CLIC_BOUTON_AUDIO:
  SOUND 3
  PRINT 35, 130, ">> Action : Bruitage Audio declenche !", 14
  WAIT 150
  PRINT 35, 130, "                                      ", 0
  GOTO BOUCLE_EVENEMENTS

CLIC_BOUTON_REBOOT:
  PRINT 35, 130, ">> Action : Redemarrage du PC en cours...", 12
  SOUND 4
  WAIT 300
  REBOOT

CLIC_BOUTON_SHUTDOWN:
  PRINT 35, 130, ">> Action : Extinction electrique...", 5
  WAIT 300
  SHUTDOWN

// --------------------------------------------
// SOUS-ROUTINES (GROUPES DE COMMANDES AVEC CALL / RET)
// --------------------------------------------
DESSINER_BUREAU:
  FILLRECT 0, 0, 330, 12, 8
  PRINT 6, 2, "VIRTUARCH OS v3.5 [INTERACTIF & SOURIS]", 15
  PRINT 240, 2, "MEM: 64Ko OK", 14
  RET

DESSINER_FENETRE:
  FILLRECT 20, 20, 290, 125, 10
  RECT 20, 20, 290, 125, 3
  FILLRECT 20, 20, 290, 14, 3
  PRINT 26, 24, "TABLEAU DE BORD DE VOTRE SYSTEME", 0

  PRINT 35, 42, "CLIQUEZ DIRECTEMENT SUR UN BOUTON CI-DESSOUS :", 15
  PRINT 35, 56, "-> Boutons cliquables avec IF_CLICK et la souris", 6
  PRINT 35, 68, "-> Touches directes : [1] Son, [R] Reboot, [S] Eteindre", 14
  PRINT 35, 80, "-> Code organise en sous-routines (CALL / RET)", 1
  RET

DESSINER_TOUS_LES_BOUTONS:
  // Bouton 1 : Audio
  FILLRECT 35, 105, 75, 20, 2
  RECT 35, 105, 75, 20, 15
  PRINT 42, 111, "[1] AUDIO", 0

  // Bouton 2 : Reboot
  FILLRECT 120, 105, 85, 20, 12
  RECT 120, 105, 85, 20, 15
  PRINT 126, 111, "[R] REBOOT", 0

  // Bouton 3 : Shutdown
  FILLRECT 215, 105, 85, 20, 5
  RECT 215, 105, 85, 20, 15
  PRINT 222, 111, "[S] ETEINDRE", 15
  RET`,
    },
    {
      nom: 'Animation Arcade Temps Réel : Balle Rebondissante (30 FPS)',
      desc: 'Véritable animation temps réel avec balle se déplaçant, rebonds physiques, sons d\'impacts et rafraîchissement fluide',
      code: `// ============================================
// ANIMATION TEMPS REEL : BALLE REBONDISSANTE & ARCADE
// ============================================
CLEAR 0
PRINT 65, 8, "ANIMATION FLUIDE TEMPS REEL (30 FPS)", 14
RECT 15, 22, 300, 120, 3
PRINT 20, 148, "La balle s'anime grace a la boucle GOTO et WAIT 30", 15

// Variables d'état :
// R0 = Position X (50), R1 = Position Y (40)
// R2 = Vitesse VX (3), R3 = Vitesse VY (2)
SET R0, 50
SET R1, 40
SET R2, 3
SET R3, 2

BOUCLE_ANIMATION:
  // 1. Efface la précédente position de la balle
  FILLCIRCLE R0, R1, 7, 0

  // 2. Met à jour la position X (X = X + VX)
  ADD R0, R2

  // 3. Test Rebond Mur Droit (X >= 295)
  IF_GT R0, 295, REBOND_DROIT
  // Test Rebond Mur Gauche (X <= 25)
  IF_LT R0, 25, REBOND_GAUCHE

SUITE_Y:
  // 4. Met à jour la position Y (Y = Y + VY)
  ADD R1, R3

  // 5. Test Rebond Mur Bas (Y >= 125)
  IF_GT R1, 125, REBOND_BAS
  // Test Rebond Mur Haut (Y <= 32)
  IF_LT R1, 32, REBOND_HAUT

DESSIN_FRAME:
  // 6. Dessine la nouvelle position en Cyan lumineux
  FILLCIRCLE R0, R1, 6, 11

  // 7. Pause fluide de 30ms pour caler à 30 images/seconde
  WAIT 30
  GOTO BOUCLE_ANIMATION

// Traitement des rebonds et sons physiques
REBOND_DROIT:
  SET R2, -3
  SOUND 6
  GOTO SUITE_Y

REBOND_GAUCHE:
  SET R2, 3
  SOUND 6
  GOTO SUITE_Y

REBOND_BAS:
  SET R3, -2
  SOUND 6
  GOTO DESSIN_FRAME

REBOND_HAUT:
  SET R3, 2
  SOUND 6
  GOTO DESSIN_FRAME`,
    },
    {
      nom: 'Démonstration Assembleur : Sous-routines, Pile & Macros',
      desc: 'Exemple d\'organisation de code avec MACRO, CALL/RET (procédures) et PUSH/POP (pile)',
      code: `// ============================================
// GROUPES DE COMMANDES EN ASSEMBLEUR
// 1. MACROS (Gabarits réutilisables)
// 2. SOUS-ROUTINES (CALL / RET)
// 3. PILE MATERIELLE (PUSH / POP)
// ============================================
CLEAR 0
PRINT 10, 8, "EXEMPLE DE GROUPES DE COMMANDES (ASSEMBLEUR)", 15

// Démonstration 1 : Appel de sous-routine pour dessiner une fenêtre
CALL CREER_CADRE

// Démonstration 2 : Sauvegarde et restauration sur la pile
SET R0, 100
PUSH R0       // Sauvegarde 100 sur la pile
SET R0, 0     // Registre écrasé
POP R0        // Récupère 100 depuis la pile !

PRINT 30, 45, "SOUS-ROUTINE 'CREER_CADRE' EXECUTEE AVEC SUCCES !", 14
PRINT 30, 60, "LA PILE A RESTAURE LA VALEUR DU REGISTRE R0.", 15
PRINT 30, 75, "UTILISEZ CALL POUR ENCHAINER VOS FONCTIONS.", 11

// Démonstration 3 : Appel de la sous-routine bouton
CALL FAIRE_BOUTON
SOUND 2
HALT

// --------------------------------------------
// DEFINITION DES GROUPES DE COMMANDES (PROCEDURES)
// --------------------------------------------
CREER_CADRE:
  RECT 20, 25, 290, 115, 3
  LINE 20, 40, 310, 40, 3
  PRINT 25, 29, "FENETRE MODULAIRE GENIERE PAR SOUS-ROUTINE", 1
  RET

FAIRE_BOUTON:
  FILLRECT 30, 100, 80, 20, 2
  RECT 30, 100, 80, 20, 15
  PRINT 36, 106, "[OK] VALIDER", 0
  RET`,
    },
    {
      nom: 'Palette Graphique 16 Couleurs RGB',
      desc: 'Démonstration des 16 couleurs matérielles RGB (cercles, rectangles pleins, lignes et texte)',
      code: `// Demonstration Graphique Pleine Palette RGB
CLEAR 0
PRINT 10, 8, "TEST COMPLET PALETTE RGB (16 COULEURS BINAIRES)", 15

// Affichage des blocs de couleur 0 à 15
FILLRECT 10, 25, 16, 20, 0
FILLRECT 28, 25, 16, 20, 1
FILLRECT 46, 25, 16, 20, 2
FILLRECT 64, 25, 16, 20, 3
FILLRECT 82, 25, 16, 20, 4
FILLRECT 100, 25, 16, 20, 5
FILLRECT 118, 25, 16, 20, 6
FILLRECT 136, 25, 16, 20, 7
FILLRECT 154, 25, 16, 20, 8
FILLRECT 172, 25, 16, 20, 9
FILLRECT 190, 25, 16, 20, 10
FILLRECT 208, 25, 16, 20, 11
FILLRECT 226, 25, 16, 20, 12
FILLRECT 244, 25, 16, 20, 13
FILLRECT 262, 25, 16, 20, 14
FILLRECT 280, 25, 16, 20, 15

// Cercles et formes géométriques
FILLCIRCLE 60, 90, 25, 7
CIRCLE 60, 90, 28, 14

FILLCIRCLE 165, 90, 25, 9
CIRCLE 165, 90, 28, 11

FILLCIRCLE 270, 90, 25, 12
CIRCLE 270, 90, 28, 6

// Lignes géométriques
LINE 10, 130, 320, 130, 3
LINE 10, 134, 320, 134, 1

PRINT 25, 145, "RGB 330x165 : AUCUNE RESTRICTION - VRAM LIBRE", 14
SOUND 3
HALT`,
    },
  ];

  public ajouterRegle(motCle: string, description: string): RegleSyntaxe {
    const nextOpcodeNum = this.regles.length + 1;
    const opcodeBinaire = '0b' + nextOpcodeNum.toString(2).padStart(8, '0');
    const nouvelleRegle: RegleSyntaxe = {
      nom: motCle.toUpperCase(),
      motCle: motCle.toUpperCase(),
      opcodeBinaire,
      description,
    };
    this.regles.push(nouvelleRegle);
    return nouvelleRegle;
  }

  public isRegister(token: string): boolean {
    return /^R[0-7]$/i.test((token || '').trim());
  }

  public parserValeurSignee(token: string): number {
    const clean = (token || '').trim();
    if (this.isRegister(clean)) {
      return parseInt(clean.substring(1), 10) & 0x07;
    }
    if (clean.startsWith('0x') || clean.startsWith('0X')) {
      return parseInt(clean.substring(2), 16) || 0;
    }
    if (clean.startsWith('0b') || clean.startsWith('0B')) {
      return parseInt(clean.substring(2), 2) || 0;
    }
    const val = parseInt(clean, 10);
    return isNaN(val) ? 0 : val;
  }

  /**
   * Encode un opérande binaire : soit un Registre (R0..R7), soit une Valeur Immédiate 16-bit signée
   * - Type 0x01 (Registre) : [0x01, regIdx (0..7)] (2 octets)
   * - Type 0x00 (Immédiat) : [0x00, msb, lsb] (3 octets)
   */
  public encoderOperande(token: string, octets: number[], bytecodeBinaire: string[]): number {
    const clean = (token || '').trim();
    if (this.isRegister(clean)) {
      const reg = parseInt(clean.substring(1), 10) & 0x07;
      this.ajouterOctet(0x01, octets, bytecodeBinaire); // Tag 1: Registre
      this.ajouterOctet(reg, octets, bytecodeBinaire);
      return 2;
    } else {
      const val = this.parserValeurSignee(clean);
      this.ajouterOctet(0x00, octets, bytecodeBinaire); // Tag 0: Immédiat 16-bit
      this.ajouterOctet((val >> 8) & 0xff, octets, bytecodeBinaire);
      this.ajouterOctet(val & 0xff, octets, bytecodeBinaire);
      return 3;
    }
  }

  /**
   * Parse une valeur immédiate ou un registre (supporte décimal, négatif, 0xHEX, 0bBIN, ou R0..R7)
   */
  public parserValeur(token: string): number {
    return this.parserValeurSignee(token);
  }

  /**
   * Parse un code de touche clavier (supporte code direct, touches de fonction F1..F12, ENTER, SPACE, ou caractère '"R"')
   */
  public parserCodeTouche(token: string): number {
    const clean = (token || '').trim();
    const unquoted = clean.replace(/^["']/, '').replace(/["']$/, '').toUpperCase();
    if (unquoted === 'ENTER' || unquoted === 'ENTREE' || unquoted === 'RETURN') return 13;
    if (unquoted === 'SPACE' || unquoted === 'ESPACE') return 32;
    if (unquoted === 'ESC' || unquoted === 'ESCAPE') return 27;
    if (unquoted === 'TAB') return 9;
    if (unquoted === 'BACKSPACE') return 8;
    if (unquoted === 'UP') return 38;
    if (unquoted === 'DOWN') return 40;
    if (unquoted === 'LEFT') return 37;
    if (unquoted === 'RIGHT') return 39;

    // Touches de fonction F1 à F12
    if (unquoted === 'F1') return 112;
    if (unquoted === 'F2') return 113;
    if (unquoted === 'F3') return 114;
    if (unquoted === 'F4') return 115;
    if (unquoted === 'F5') return 116;
    if (unquoted === 'F6') return 117;
    if (unquoted === 'F7') return 118;
    if (unquoted === 'F8') return 119;
    if (unquoted === 'F9') return 120;
    if (unquoted === 'F10') return 121;
    if (unquoted === 'F11') return 122;
    if (unquoted === 'F12') return 123;

    if (unquoted.length === 1) return unquoted.charCodeAt(0);
    return this.parserValeur(clean);
  }

  /**
   * Préprocesseur de Macros en Assembleur :
   * Permet de définir des groupes de commandes réutilisables avec arguments :
   * MACRO NOM_MACRO arg1, arg2
   *   COMMANDES...
   * ENDMACRO
   */
  public developperMacros(source: string): string {
    const lignes = source.split('\n');
    const macros: Record<string, { params: string[]; corps: string[] }> = {};
    const resultat: string[] = [];

    let macroEnCours: string | null = null;
    let paramsEnCours: string[] = [];
    let corpsEnCours: string[] = [];

    for (let i = 0; i < lignes.length; i++) {
      const ligneBrute = lignes[i];
      const trimmee = ligneBrute.trim();

      if (trimmee.toUpperCase().startsWith('MACRO ')) {
        const entete = trimmee.substring(6).trim();
        const spaceIdx = entete.indexOf(' ');
        if (spaceIdx === -1) {
          macroEnCours = entete.toUpperCase();
          paramsEnCours = [];
        } else {
          macroEnCours = entete.substring(0, spaceIdx).toUpperCase();
          paramsEnCours = this.separerArguments(entete.substring(spaceIdx + 1));
        }
        corpsEnCours = [];
        continue;
      }

      if (trimmee.toUpperCase() === 'ENDMACRO' || trimmee.toUpperCase() === 'END_MACRO') {
        if (macroEnCours) {
          macros[macroEnCours] = { params: paramsEnCours, corps: corpsEnCours };
          macroEnCours = null;
        }
        continue;
      }

      if (macroEnCours) {
        corpsEnCours.push(ligneBrute);
        continue;
      }

      // Vérifier si cette ligne invoque une macro définie
      const premierMot = trimmee.split(/[\s,]+/)[0].toUpperCase();
      if (macros[premierMot]) {
        const macroDef = macros[premierMot];
        const argStr = trimmee.substring(premierMot.length).trim();
        const argsDonnes = argStr ? this.separerArguments(argStr) : [];

        for (const ligneMacro of macroDef.corps) {
          let ligneEtendue = ligneMacro;
          for (let p = 0; p < macroDef.params.length; p++) {
            const nomParam = macroDef.params[p];
            const valeurParam = argsDonnes[p] || '';
            const regex = new RegExp(`\\b${nomParam}\\b`, 'g');
            ligneEtendue = ligneEtendue.replace(regex, valeurParam);
          }
          resultat.push(ligneEtendue);
        }
        continue;
      }

      resultat.push(ligneBrute);
    }

    return resultat.join('\n');
  }

  /**
   * Compilateur Binaire : traduit le code source en un flux pur d'octets binaires
   */
  public compilerEnBinaire(source: string, nomApp: string = 'MonApp'): ProgrammeCompileBinaire {
    // 1ère passe : Expansion des macros
    const sourceApresMacros = this.developperMacros(source);
    const lignes = sourceApresMacros.split('\n');
    const bytecodeBinaire: string[] = [];
    const octets: number[] = [];
    const symboles: Record<string, number> = {};
    const sautsACompleter: { pos: number; etiquette: string }[] = [];
    const logsCompilation: string[] = [];

    logsCompilation.push(`[Compilateur] Démarrage de la compilation pour "${nomApp}"...`);
    logsCompilation.push(`[Compilateur] Expansion des macros et analyse syntaxique...`);

    let adresse = 0;

    for (let i = 0; i < lignes.length; i++) {
      let ligne = lignes[i].trim();
      if (!ligne || ligne.startsWith('//') || ligne.startsWith('#')) {
        continue;
      }

      // Détection des étiquettes (ex: "BOUCLE:" ou "LABEL BOUCLE")
      if (ligne.endsWith(':')) {
        const nomEtiquette = ligne.substring(0, ligne.length - 1).trim().toUpperCase();
        symboles[nomEtiquette] = adresse;
        logsCompilation.push(`  + Étiquette trouvée "${nomEtiquette}" à l'adresse 0x${adresse.toString(16).toUpperCase()}`);
        continue;
      }

      // Extraction commande et arguments
      let cmd = '';
      let argsStr = '';
      const firstSpace = ligne.indexOf(' ');
      if (firstSpace === -1) {
        cmd = ligne.toUpperCase();
      } else {
        cmd = ligne.substring(0, firstSpace).toUpperCase();
        argsStr = ligne.substring(firstSpace + 1).trim();
      }

      // Aliases courants
      if (cmd === 'RESTART' || cmd === 'RESET') cmd = 'REBOOT';
      if (cmd === 'POWEROFF') cmd = 'SHUTDOWN';
      if (cmd === 'JUMP') cmd = 'GOTO';
      if (cmd === 'CLS') cmd = 'CLEAR';
      if (cmd === 'FRECT') cmd = 'FILLRECT';
      if (cmd === 'FCIRCLE') cmd = 'FILLCIRCLE';
      if (cmd === 'SLEEP') cmd = 'WAIT';

      const parts = this.separerArguments(argsStr);

      switch (cmd) {
        case 'CLEAR': {
          const col = parts.length > 0 ? this.parserValeur(parts[0]) : 0;
          this.ajouterOctet(OPCODES.CLEAR, octets, bytecodeBinaire);
          this.ajouterOctet(col, octets, bytecodeBinaire);
          adresse += 2;
          break;
        }

        case 'COLOR': {
          const col = parts.length > 0 ? this.parserValeur(parts[0]) : 1;
          this.ajouterOctet(OPCODES.COLOR, octets, bytecodeBinaire);
          this.ajouterOctet(col, octets, bytecodeBinaire);
          adresse += 2;
          break;
        }

        case 'PRINT': {
          // PRINT x, y, "texte", [col]
          this.ajouterOctet(OPCODES.PRINT, octets, bytecodeBinaire);
          adresse += 1;
          adresse += this.encoderOperande(parts[0] || '0', octets, bytecodeBinaire);
          adresse += this.encoderOperande(parts[1] || '0', octets, bytecodeBinaire);
          const rawText = parts[2] || '';
          const texte = rawText.replace(/^["']/, '').replace(/["']$/, '');
          const col = parts.length > 3 ? this.parserValeur(parts[3]) : 0xff; // 0xff = use active color

          this.ajouterOctet(col, octets, bytecodeBinaire);
          this.ajouterOctet(texte.length & 0xff, octets, bytecodeBinaire);
          adresse += 2;

          for (let c = 0; c < texte.length; c++) {
            this.ajouterOctet(texte.charCodeAt(c) & 0xff, octets, bytecodeBinaire);
            adresse++;
          }
          break;
        }

        case 'PIXEL': {
          // PIXEL x, y, [col]
          this.ajouterOctet(OPCODES.PIXEL, octets, bytecodeBinaire);
          adresse += 1;
          adresse += this.encoderOperande(parts[0] || '0', octets, bytecodeBinaire);
          adresse += this.encoderOperande(parts[1] || '0', octets, bytecodeBinaire);
          const col = parts.length > 2 ? this.parserValeur(parts[2]) : 0xff;
          this.ajouterOctet(col, octets, bytecodeBinaire);
          adresse += 1;
          break;
        }

        case 'RECT': {
          // RECT x, y, w, h, [col]
          this.ajouterOctet(OPCODES.RECT, octets, bytecodeBinaire);
          adresse += 1;
          adresse += this.encoderOperande(parts[0] || '0', octets, bytecodeBinaire);
          adresse += this.encoderOperande(parts[1] || '0', octets, bytecodeBinaire);
          adresse += this.encoderOperande(parts[2] || '10', octets, bytecodeBinaire);
          adresse += this.encoderOperande(parts[3] || '10', octets, bytecodeBinaire);
          const col = parts.length > 4 ? this.parserValeur(parts[4]) : 0xff;
          this.ajouterOctet(col, octets, bytecodeBinaire);
          adresse += 1;
          break;
        }

        case 'FILLRECT': {
          // FILLRECT x, y, w, h, [col]
          this.ajouterOctet(OPCODES.FILLRECT, octets, bytecodeBinaire);
          adresse += 1;
          adresse += this.encoderOperande(parts[0] || '0', octets, bytecodeBinaire);
          adresse += this.encoderOperande(parts[1] || '0', octets, bytecodeBinaire);
          adresse += this.encoderOperande(parts[2] || '10', octets, bytecodeBinaire);
          adresse += this.encoderOperande(parts[3] || '10', octets, bytecodeBinaire);
          const col = parts.length > 4 ? this.parserValeur(parts[4]) : 0xff;
          this.ajouterOctet(col, octets, bytecodeBinaire);
          adresse += 1;
          break;
        }

        case 'CIRCLE': {
          // CIRCLE xc, yc, r, [col]
          this.ajouterOctet(OPCODES.CIRCLE, octets, bytecodeBinaire);
          adresse += 1;
          adresse += this.encoderOperande(parts[0] || '0', octets, bytecodeBinaire);
          adresse += this.encoderOperande(parts[1] || '0', octets, bytecodeBinaire);
          adresse += this.encoderOperande(parts[2] || '5', octets, bytecodeBinaire);
          const col = parts.length > 3 ? this.parserValeur(parts[3]) : 0xff;
          this.ajouterOctet(col, octets, bytecodeBinaire);
          adresse += 1;
          break;
        }

        case 'FILLCIRCLE': {
          // FILLCIRCLE xc, yc, r, [col]
          this.ajouterOctet(OPCODES.FILLCIRCLE, octets, bytecodeBinaire);
          adresse += 1;
          adresse += this.encoderOperande(parts[0] || '0', octets, bytecodeBinaire);
          adresse += this.encoderOperande(parts[1] || '0', octets, bytecodeBinaire);
          adresse += this.encoderOperande(parts[2] || '5', octets, bytecodeBinaire);
          const col = parts.length > 3 ? this.parserValeur(parts[3]) : 0xff;
          this.ajouterOctet(col, octets, bytecodeBinaire);
          adresse += 1;
          break;
        }

        case 'LINE': {
          // LINE x0, y0, x1, y1, [col]
          this.ajouterOctet(OPCODES.LINE, octets, bytecodeBinaire);
          adresse += 1;
          adresse += this.encoderOperande(parts[0] || '0', octets, bytecodeBinaire);
          adresse += this.encoderOperande(parts[1] || '0', octets, bytecodeBinaire);
          adresse += this.encoderOperande(parts[2] || '10', octets, bytecodeBinaire);
          adresse += this.encoderOperande(parts[3] || '10', octets, bytecodeBinaire);
          const col = parts.length > 4 ? this.parserValeur(parts[4]) : 0xff;
          this.ajouterOctet(col, octets, bytecodeBinaire);
          adresse += 1;
          break;
        }

        case 'BEEP': {
          // BEEP freq, [dur]
          const freq = this.parserValeur(parts[0] || '440');
          const dur = this.parserValeur(parts[1] || '80');
          const msb = (freq >> 8) & 0xff;
          const lsb = freq & 0xff;

          this.ajouterOctet(OPCODES.BEEP, octets, bytecodeBinaire);
          this.ajouterOctet(msb, octets, bytecodeBinaire);
          this.ajouterOctet(lsb, octets, bytecodeBinaire);
          this.ajouterOctet(dur & 0xff, octets, bytecodeBinaire);
          adresse += 4;
          break;
        }

        case 'SOUND': {
          // SOUND fx_id (1=laser, 2=jump, 3=coin, 4=explosion, 5=powerup, 6=rebond)
          const fxId = this.parserValeur(parts[0] || '1');
          this.ajouterOctet(OPCODES.SOUND, octets, bytecodeBinaire);
          this.ajouterOctet(fxId, octets, bytecodeBinaire);
          adresse += 2;
          break;
        }

        case 'WAIT': {
          // WAIT ms
          this.ajouterOctet(OPCODES.WAIT, octets, bytecodeBinaire);
          adresse += 1;
          adresse += this.encoderOperande(parts[0] || '100', octets, bytecodeBinaire);
          break;
        }

        case 'REBOOT': {
          this.ajouterOctet(OPCODES.REBOOT, octets, bytecodeBinaire);
          adresse += 1;
          break;
        }

        case 'SHUTDOWN': {
          this.ajouterOctet(OPCODES.SHUTDOWN, octets, bytecodeBinaire);
          adresse += 1;
          break;
        }

        case 'SET': {
          // SET reg, val_or_reg
          const reg = this.parserValeur(parts[0] || 'R0') & 0x07;
          this.ajouterOctet(OPCODES.SET, octets, bytecodeBinaire);
          this.ajouterOctet(reg, octets, bytecodeBinaire);
          adresse += 2;
          adresse += this.encoderOperande(parts[1] || '0', octets, bytecodeBinaire);
          break;
        }

        case 'ADD': {
          // ADD reg, val_or_reg
          const reg = this.parserValeur(parts[0] || 'R0') & 0x07;
          this.ajouterOctet(OPCODES.ADD, octets, bytecodeBinaire);
          this.ajouterOctet(reg, octets, bytecodeBinaire);
          adresse += 2;
          adresse += this.encoderOperande(parts[1] || '0', octets, bytecodeBinaire);
          break;
        }

        case 'SUB': {
          // SUB reg, val_or_reg
          const reg = this.parserValeur(parts[0] || 'R0') & 0x07;
          this.ajouterOctet(OPCODES.SUB, octets, bytecodeBinaire);
          this.ajouterOctet(reg, octets, bytecodeBinaire);
          adresse += 2;
          adresse += this.encoderOperande(parts[1] || '0', octets, bytecodeBinaire);
          break;
        }

        case 'RANDOM': {
          const reg = this.parserValeur(parts[0] || 'R0') & 0x07;
          const min = this.parserValeur(parts[1] || '0') & 0xff;
          const max = this.parserValeur(parts[2] || '255') & 0xff;
          this.ajouterOctet(OPCODES.RANDOM, octets, bytecodeBinaire);
          this.ajouterOctet(reg, octets, bytecodeBinaire);
          this.ajouterOctet(min, octets, bytecodeBinaire);
          this.ajouterOctet(max, octets, bytecodeBinaire);
          adresse += 4;
          break;
        }

        case 'GOTO': {
          // GOTO label
          const target = (parts[0] || '').toUpperCase();
          this.ajouterOctet(OPCODES.GOTO, octets, bytecodeBinaire);
          sautsACompleter.push({ pos: octets.length, etiquette: target });
          this.ajouterOctet(0, octets, bytecodeBinaire); // msb placeholder
          this.ajouterOctet(0, octets, bytecodeBinaire); // lsb placeholder
          adresse += 3;
          break;
        }

        case 'IF_EQ': {
          // IF_EQ reg, val_or_reg, label
          const reg = this.parserValeur(parts[0] || 'R0') & 0x07;
          const target = (parts[2] || '').toUpperCase();
          this.ajouterOctet(OPCODES.IF_EQ, octets, bytecodeBinaire);
          this.ajouterOctet(reg, octets, bytecodeBinaire);
          adresse += 2;
          adresse += this.encoderOperande(parts[1] || '0', octets, bytecodeBinaire);
          sautsACompleter.push({ pos: octets.length, etiquette: target });
          this.ajouterOctet(0, octets, bytecodeBinaire);
          this.ajouterOctet(0, octets, bytecodeBinaire);
          adresse += 2;
          break;
        }

        case 'GETKEY': {
          const reg = this.parserValeur(parts[0] || 'R0') & 0x07;
          this.ajouterOctet(OPCODES.GETKEY, octets, bytecodeBinaire);
          this.ajouterOctet(reg, octets, bytecodeBinaire);
          adresse += 2;
          break;
        }

        case 'MOUSE_X': {
          const reg = this.parserValeur(parts[0] || 'R0') & 0x07;
          this.ajouterOctet(OPCODES.MOUSE_X, octets, bytecodeBinaire);
          this.ajouterOctet(reg, octets, bytecodeBinaire);
          adresse += 2;
          break;
        }

        case 'MOUSE_Y': {
          const reg = this.parserValeur(parts[0] || 'R0') & 0x07;
          this.ajouterOctet(OPCODES.MOUSE_Y, octets, bytecodeBinaire);
          this.ajouterOctet(reg, octets, bytecodeBinaire);
          adresse += 2;
          break;
        }

        case 'MOUSE_BTN': {
          const reg = this.parserValeur(parts[0] || 'R0') & 0x07;
          this.ajouterOctet(OPCODES.MOUSE_BTN, octets, bytecodeBinaire);
          this.ajouterOctet(reg, octets, bytecodeBinaire);
          adresse += 2;
          break;
        }

        case 'POKE': {
          const addr = this.parserValeur(parts[0] || '0');
          const val = this.parserValeur(parts[1] || '0') & 0xff;
          this.ajouterOctet(OPCODES.POKE, octets, bytecodeBinaire);
          this.ajouterOctet((addr >> 8) & 0xff, octets, bytecodeBinaire);
          this.ajouterOctet(addr & 0xff, octets, bytecodeBinaire);
          this.ajouterOctet(val, octets, bytecodeBinaire);
          adresse += 4;
          break;
        }

        case 'PEEK': {
          const addr = this.parserValeur(parts[0] || '0');
          const reg = this.parserValeur(parts[1] || 'R0') & 0x07;
          this.ajouterOctet(OPCODES.PEEK, octets, bytecodeBinaire);
          this.ajouterOctet((addr >> 8) & 0xff, octets, bytecodeBinaire);
          this.ajouterOctet(addr & 0xff, octets, bytecodeBinaire);
          this.ajouterOctet(reg, octets, bytecodeBinaire);
          adresse += 4;
          break;
        }

        case 'CALL': {
          // CALL label (Appel de sous-routine)
          const target = (parts[0] || '').toUpperCase();
          this.ajouterOctet(OPCODES.CALL, octets, bytecodeBinaire);
          sautsACompleter.push({ pos: octets.length, etiquette: target });
          this.ajouterOctet(0, octets, bytecodeBinaire); // msb placeholder
          this.ajouterOctet(0, octets, bytecodeBinaire); // lsb placeholder
          adresse += 3;
          break;
        }

        case 'RET': {
          // RET (Retour de sous-routine)
          this.ajouterOctet(OPCODES.RET, octets, bytecodeBinaire);
          adresse += 1;
          break;
        }

        case 'PUSH': {
          // PUSH reg
          const reg = this.parserValeur(parts[0] || 'R0') & 0x07;
          this.ajouterOctet(OPCODES.PUSH, octets, bytecodeBinaire);
          this.ajouterOctet(reg, octets, bytecodeBinaire);
          adresse += 2;
          break;
        }

        case 'POP': {
          // POP reg
          const reg = this.parserValeur(parts[0] || 'R0') & 0x07;
          this.ajouterOctet(OPCODES.POP, octets, bytecodeBinaire);
          this.ajouterOctet(reg, octets, bytecodeBinaire);
          adresse += 2;
          break;
        }

        case 'IF_CLICK': {
          // IF_CLICK x, y, w, h, label
          const target = (parts[4] || '').toUpperCase();

          this.ajouterOctet(OPCODES.IF_CLICK, octets, bytecodeBinaire);
          adresse += 1;
          adresse += this.encoderOperande(parts[0] || '0', octets, bytecodeBinaire);
          adresse += this.encoderOperande(parts[1] || '0', octets, bytecodeBinaire);
          adresse += this.encoderOperande(parts[2] || '10', octets, bytecodeBinaire);
          adresse += this.encoderOperande(parts[3] || '10', octets, bytecodeBinaire);
          sautsACompleter.push({ pos: octets.length, etiquette: target });
          this.ajouterOctet(0, octets, bytecodeBinaire);
          this.ajouterOctet(0, octets, bytecodeBinaire);
          adresse += 2;
          break;
        }

        case 'IF_KEY': {
          // IF_KEY codeTouche, label
          const codeTouche = this.parserCodeTouche(parts[0] || '13');
          const target = (parts[1] || '').toUpperCase();

          this.ajouterOctet(OPCODES.IF_KEY, octets, bytecodeBinaire);
          this.ajouterOctet(codeTouche & 0xff, octets, bytecodeBinaire);
          sautsACompleter.push({ pos: octets.length, etiquette: target });
          this.ajouterOctet(0, octets, bytecodeBinaire);
          this.ajouterOctet(0, octets, bytecodeBinaire);
          adresse += 4;
          break;
        }

        case 'IF_NE': {
          // IF_NE reg, val_or_reg, label
          const reg = this.parserValeur(parts[0] || 'R0') & 0x07;
          const target = (parts[2] || '').toUpperCase();
          this.ajouterOctet(OPCODES.IF_NE, octets, bytecodeBinaire);
          this.ajouterOctet(reg, octets, bytecodeBinaire);
          adresse += 2;
          adresse += this.encoderOperande(parts[1] || '0', octets, bytecodeBinaire);
          sautsACompleter.push({ pos: octets.length, etiquette: target });
          this.ajouterOctet(0, octets, bytecodeBinaire);
          this.ajouterOctet(0, octets, bytecodeBinaire);
          adresse += 2;
          break;
        }

        case 'IF_LT': {
          // IF_LT reg, val_or_reg, label
          const reg = this.parserValeur(parts[0] || 'R0') & 0x07;
          const target = (parts[2] || '').toUpperCase();
          this.ajouterOctet(OPCODES.IF_LT, octets, bytecodeBinaire);
          this.ajouterOctet(reg, octets, bytecodeBinaire);
          adresse += 2;
          adresse += this.encoderOperande(parts[1] || '0', octets, bytecodeBinaire);
          sautsACompleter.push({ pos: octets.length, etiquette: target });
          this.ajouterOctet(0, octets, bytecodeBinaire);
          this.ajouterOctet(0, octets, bytecodeBinaire);
          adresse += 2;
          break;
        }

        case 'IF_GT': {
          // IF_GT reg, val_or_reg, label
          const reg = this.parserValeur(parts[0] || 'R0') & 0x07;
          const target = (parts[2] || '').toUpperCase();
          this.ajouterOctet(OPCODES.IF_GT, octets, bytecodeBinaire);
          this.ajouterOctet(reg, octets, bytecodeBinaire);
          adresse += 2;
          adresse += this.encoderOperande(parts[1] || '0', octets, bytecodeBinaire);
          sautsACompleter.push({ pos: octets.length, etiquette: target });
          this.ajouterOctet(0, octets, bytecodeBinaire);
          this.ajouterOctet(0, octets, bytecodeBinaire);
          adresse += 2;
          break;
        }

        case 'HALT': {
          this.ajouterOctet(OPCODES.HALT, octets, bytecodeBinaire);
          adresse += 1;
          break;
        }

        default:
          logsCompilation.push(`  [AVERTISSEMENT] Ligne ${i + 1} : Commande non reconnue "${cmd}"`);
          break;
      }
    }

    // Deuxième passe : Résolution des adresses d'étiquettes
    for (const saut of sautsACompleter) {
      const dest = symboles[saut.etiquette] ?? 0;
      const msb = (dest >> 8) & 0xff;
      const lsb = dest & 0xff;
      octets[saut.pos] = msb;
      octets[saut.pos + 1] = lsb;
      bytecodeBinaire[saut.pos] = '0b' + msb.toString(2).padStart(8, '0');
      bytecodeBinaire[saut.pos + 1] = '0b' + lsb.toString(2).padStart(8, '0');
      logsCompilation.push(`  -> Résolution saut vers "${saut.etiquette}" à l'adresse 0x${dest.toString(16).toUpperCase()}`);
    }

    logsCompilation.push(`[Compilateur] Succès ! ${octets.length} octets générés en binaire pur.`);

    return {
      nomApplication: nomApp,
      sourceCode: source,
      bytecodeBinaire,
      octets,
      symboles,
      logsCompilation,
      succes: true,
    };
  }

  private ajouterOctet(val: number, octets: number[], binaire: string[]): void {
    const clamped = val & 0xff;
    octets.push(clamped);
    binaire.push('0b' + clamped.toString(2).padStart(8, '0'));
  }

  private separerArguments(str: string): string[] {
    const res: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < str.length; i++) {
      const c = str[i];
      if (c === '"' || c === "'") {
        inQuotes = !inQuotes;
        cur += c;
      } else if (c === ',' && !inQuotes) {
        res.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    if (cur.trim()) {
      res.push(cur.trim());
    }
    return res;
  }
}
