import { ControleurVGA } from '../hardware/vga';
import { ClavierUSB } from '../hardware/keyboard';
import { SourisUSB } from '../hardware/mouse';
import { HubUSB } from '../hardware/usbHub';
import { SortieAudio } from '../hardware/audio';
import { LanguageStudio, ProgrammeCompileBinaire } from './languageStudio';

export type OngletOS = 'studio' | 'terminal' | 'paint' | 'io_inspector';
export type ModeDemarrage = 'bios_vierge' | 'hello_world' | 'os_bureau' | 'programme_personnalise';

export interface AlerteSecurite {
  action: 'BOOT_BOS' | 'HELLO_WORLD' | 'RESET_BIOS';
  nomTouche: string;
  titre: string;
  expireAt: number;
  compteurFrappes: number;
}

/**
 * Code Source du Noyau B-OS (affiché et modifiable dans les paramètres)
 */
export const CODE_SOURCE_OS_DEFAUT = `// ==========================================
// NOYAU B-OS v2.0 - ARCHITECTURE 100% BINAIRE
// ==========================================
// Pilotes matériels : Port USB 1 (Clavier), USB 2 (Souris), USB 3 (Flash)
// Affichage : VRAM 330x165 - Palette Binaire 16 Couleurs (0b0000 - 0b1111)
//
// CONFIGURATION DE BOOT :
BOOT_SEQUENCE:
  0b00000001  // INIT_SUBSYSTEM_VGA_330X165
  0b00000010  // MOUNT_USB_HUB_PORTS_1_2_3
  0b00000011  // LOAD_DESKTOP_WINDOW_MANAGER
  0b00000100  // ENABLE_INTERRUPTS_IRQ0_IRQ1_IRQ2

// ROUTINE D'AFFICHAGE TITRE & COULEURS :
UI_DESKTOP_STYLE:
  COLOR_BAR_TITLE = 0b0011     // Cyan Rétro
  COLOR_TEXT_MAIN = 0b0001     // Vert Phosphore
  COLOR_ACCENT    = 0b0010     // Ambre Chaud
  COLOR_HIGHLIGHT = 0b1011     // Blanc Curseur

// ROUTINE PRINCIPALE :
LOOP:
  WAIT_FOR_EVENT
  HANDLE_USB_MOUSE_COORDS
  HANDLE_USB_KEYBOARD_SCANCODE
  REFRESH_VRAM_DISPLAY
  JUMP LOOP
`;

/**
 * Système d'Exploitation Virtuel 100% Binaire (B-OS v2.0)
 * Gère le fenêtrage, les pilotes d'E/S USB 1, USB 2, USB 3, VGA et Audio,
 * et exécute les applications créées avec le LanguageStudio.
 */
export class BinaryOS {
  public vga: ControleurVGA;
  public clavier: ClavierUSB;
  public souris: SourisUSB;
  public hubUsb: HubUSB;
  public audio: SortieAudio;
  public studio: LanguageStudio;

  public sourisX: number = 165;
  public sourisY: number = 82;

  // Par défaut, l'ordinateur démarre sur le BIOS matériel brut (vierge d'OS)
  public modeDemarrage: ModeDemarrage = 'bios_vierge';

  public codeSourceOS: string = CODE_SOURCE_OS_DEFAUT;
  public ongletActif: OngletOS = 'studio';
  public messageStatut: string = 'Matériel brut · En attente de code';
  public derniereAppCompilee: ProgrammeCompileBinaire | null = null;
  public estEnExecutionApp: boolean = false;
  public couleurPinceauPaint: number = 0b0001; // Couleur binaire sélectionnée pour Paint
  public terminalLogs: string[] = [
    'VIRTUARCH HARDWARE v1.0 initialisé.',
    'Processeur 8-Bit RISC prêt. Aucun OS chargé en mémoire.',
    'Contrôleur VGA 330x165 connecté.',
    'Périphériques connectés : Port USB 1 (Clavier), Port USB 2 (Souris), Sortie Audio.',
  ];

  // Matrice de dessin pour l'application Paint (330x165)
  public paintCanvas: Uint8Array[];

  public alerteSecurite: AlerteSecurite | null = null;
  public actionConfirmeeEnAttente: (() => void) | null = null;

  constructor(
    vga: ControleurVGA,
    clavier: ClavierUSB,
    souris: SourisUSB,
    hubUsb: HubUSB,
    audio: SortieAudio
  ) {
    this.vga = vga;
    this.clavier = clavier;
    this.souris = souris;
    this.hubUsb = hubUsb;
    this.audio = audio;
    this.studio = new LanguageStudio();

    this.sourisX = souris.x;
    this.sourisY = souris.y;

    this.paintCanvas = Array.from({ length: 165 }, () => new Uint8Array(330));

    // Prépare le compilateur avec le premier modèle
    this.compilerEtCharger(this.studio.modelesProgrammes[0].code, this.studio.modelesProgrammes[0].nom);
  }

  /**
   * Sécurité anti-fausse manoeuvre : requiert un 2e appui ou maintien prolongé
   * avant d'exécuter des actions critiques comme vider l'OS ou booter.
   */
  public verifierOuDeclencherAlerteSecurite(
    action: 'BOOT_BOS' | 'HELLO_WORLD' | 'RESET_BIOS',
    nomTouche: string,
    titre: string,
    actionFinale: () => void
  ): boolean {
    const now = Date.now();
    if (this.alerteSecurite && this.alerteSecurite.action === action && now < this.alerteSecurite.expireAt) {
      // 2e appui / maintien de la touche confirmé !
      this.alerteSecurite = null;
      this.actionConfirmeeEnAttente = null;
      actionFinale();
      return true;
    }

    // 1er appui : armement de l'alerte de confirmation (3 secondes)
    this.alerteSecurite = {
      action,
      nomTouche,
      titre,
      expireAt: now + 3000,
      compteurFrappes: 1,
    };
    this.actionConfirmeeEnAttente = actionFinale;
    this.audio.jouerBip(380, 0.08, 'triangle');
    this.rafraichirBureau();
    return false;
  }

  public dessinerBanniereSecuriteSiActive(): void {
    if (!this.alerteSecurite) return;
    const now = Date.now();
    if (now >= this.alerteSecurite.expireAt) {
      this.alerteSecurite = null;
      this.actionConfirmeeEnAttente = null;
      return;
    }

    const resteSec = Math.max(1, Math.ceil((this.alerteSecurite.expireAt - now) / 1000));
    // Bandeau d'alerte haute visibilité
    this.vga.dessinerRect(14, 138, 302, 20, 0b0110, true);  // Fond jaune ambre
    this.vga.dessinerRect(14, 138, 302, 20, 0b0101, false); // Bordure rouge
    this.vga.dessinerTexte(`! CONFIRMER : Reappuyez sur [${this.alerteSecurite.nomTouche}] (${resteSec}s)`, 20, 144, 0b0000);
  }

  /**
   * Passe la machine en mode Matériel Brut (ROM BIOS sans OS)
   */
  public passerEnModeBiosVierge(): void {
    this.modeDemarrage = 'bios_vierge';
    this.estEnExecutionApp = false;
    this.messageStatut = 'Matériel brut · Aucun OS chargé';
    this.rafraichirBureau();
  }

  /**
   * Injecte et exécute le programme minimal Hello World
   */
  public chargerHelloWorld(): void {
    this.modeDemarrage = 'hello_world';
    this.estEnExecutionApp = false;
    this.messageStatut = 'Programme Hello World exécuté';
    this.audio.jouerChimeDemarrage();
    this.rafraichirBureau();
  }

  /**
   * Charge le système d'exploitation complet de démonstration (B-OS v2.0)
   */
  public chargerOsBureau(): void {
    this.modeDemarrage = 'os_bureau';
    this.estEnExecutionApp = false;
    this.messageStatut = 'B-OS v2.0 Prêt · Tout en binaire';
    this.audio.jouerChimeDemarrage();
    this.rafraichirBureau();
  }

  /**
   * Recharge et réapplique un nouveau code source de l'OS modifié par l'utilisateur
   */
  public rechargerCodeOS(nouveauCode: string): void {
    this.codeSourceOS = nouveauCode;
    this.modeDemarrage = 'os_bureau';
    this.terminalLogs.push(`[Noyau OS] Code source du système rechargé (${nouveauCode.length} caractères).`);
    this.messageStatut = 'Noyau B-OS mis à jour avec succès !';
    this.audio.jouerChimeDemarrage();
    this.rafraichirBureau();
  }

  public compilerEtCharger(source: string, nomApp: string): ProgrammeCompileBinaire {
    const prog = this.studio.compilerEnBinaire(source, nomApp);
    this.derniereAppCompilee = prog;
    this.terminalLogs.push(`[Compilateur] Application "${nomApp}" compilée : ${prog.octets.length} octets de bytecode binaire.`);
    return prog;
  }

  /**
   * Exécute le bytecode binaire de l'application créée sur le matériel virtuel
   */
  public executerApplicationBinaire(): void {
    if (!this.derniereAppCompilee || !this.derniereAppCompilee.succes) {
      this.terminalLogs.push('[Erreur] Aucun bytecode binaire valide à exécuter.');
      return;
    }

    const octets = this.derniereAppCompilee.octets;
    let pc = 0;
    this.estEnExecutionApp = true;
    this.messageStatut = `Exécution de "${this.derniereAppCompilee.nomApplication}"...`;

    // Nettoie l'écran pour l'application (fond noir 0b0000)
    this.vga.clear(0b0000);

    let securite = 0;
    while (pc < octets.length && securite < 1200) {
      securite++;
      const op = octets[pc++];

      switch (op) {
        case 1: {
          // PRINT x, y, len, string...
          const x = octets[pc++] || 0;
          const y = octets[pc++] || 0;
          const len = octets[pc++] || 0;
          let str = '';
          for (let c = 0; c < len; c++) {
            str += String.fromCharCode(octets[pc++] || 32);
          }
          this.vga.dessinerTexte(str, x, y, 0b0001); // Vert Phosphore
          break;
        }

        case 2: {
          // PIXEL x, y
          const x = octets[pc++] || 0;
          const y = octets[pc++] || 0;
          this.vga.setPixel(x, y, 0b0011); // Cyan
          break;
        }

        case 3: {
          // RECT x, y, w, h
          const x = octets[pc++] || 0;
          const y = octets[pc++] || 0;
          const w = octets[pc++] || 10;
          const h = octets[pc++] || 10;
          this.vga.dessinerRect(x, y, w, h, 0b0010, false); // Ambre
          break;
        }

        case 4: {
          // LINE x0, y0, x1, y1
          const x0 = octets[pc++] || 0;
          const y0 = octets[pc++] || 0;
          const x1 = octets[pc++] || 10;
          const y1 = octets[pc++] || 10;
          this.vga.dessinerLigne(x0, y0, x1, y1, 0b0100); // Blanc papier
          break;
        }

        case 5: {
          // CLEAR
          this.vga.clear(0b0000);
          break;
        }

        case 6: {
          // BEEP freqMsb, freqLsb
          const msb = octets[pc++] || 0;
          const lsb = octets[pc++] || 0;
          const freq = (msb << 8) | lsb;
          this.audio.jouerBip(freq > 0 ? freq : 440, 0.15, 'square');
          break;
        }

        case 15: {
          // HALT
          pc = octets.length;
          break;
        }

        default:
          break;
      }
    }

    // Indication de sortie au bas de l'écran
    this.vga.dessinerRect(4, 150, 322, 12, 0b1010, false);
    this.vga.dessinerTexte('CLIQUEZ N\'IMPORTE OU POUR RETOURNER AU BUREAU B-OS', 10, 153, 0b0110);

    this.vga.rafraichirSignal();
    this.terminalLogs.push(`[Exécution] Application "${this.derniereAppCompilee.nomApplication}" exécutée avec succès.`);
    this.messageStatut = `Application terminée. Cliquez pour fermer.`;
    this.audio.jouerSonClicSouris();
  }

  /**
   * Rendu de l'écran selon le mode courant (BIOS Vierge, Hello World, ou Bureau OS)
   */
  public rafraichirBureau(): void {
    if (this.estEnExecutionApp) {
      this.dessinerBanniereSecuriteSiActive();
      this.vga.dessinerCurseurSouris(this.sourisX, this.sourisY);
      this.vga.rafraichirSignal();
      return;
    }

    if (this.modeDemarrage === 'bios_vierge') {
      this.rendreEcranBiosVierge();
      this.dessinerBanniereSecuriteSiActive();
      this.vga.dessinerCurseurSouris(this.sourisX, this.sourisY);
      this.vga.rafraichirSignal();
      return;
    }

    if (this.modeDemarrage === 'hello_world') {
      this.rendreEcranHelloWorld();
      this.dessinerBanniereSecuriteSiActive();
      this.vga.dessinerCurseurSouris(this.sourisX, this.sourisY);
      this.vga.rafraichirSignal();
      return;
    }

    // Mode 'os_bureau' (B-OS v2.0 complet avec Studio, Console, Paint, E/S)
    this.rendreEcranOsComplet();
    this.dessinerBanniereSecuriteSiActive();
    this.vga.dessinerCurseurSouris(this.sourisX, this.sourisY);
    this.vga.rafraichirSignal();
  }

  /**
   * Écran Matériel Brut : ROM BIOS sans OS préchargé
   */
  private rendreEcranBiosVierge(): void {
    this.vga.clear(0b0000);

    // 1. Titre BIOS ROM (Y: 8..20)
    this.vga.dessinerTexte('=== VIRTUARCH HARDWARE (ROM BIOS v1.0) ===', 14, 8, 0b0011);
    this.vga.dessinerTexte('MATERIEL BRUT INITIALISE - SANS OS PRECHARGE', 14, 19, 0b0100);

    // Ligne séparatrice
    this.vga.dessinerLigne(14, 29, 316, 29, 0b1010);

    // 2. Détection des composants matériels réels (Y: 34..66)
    this.vga.dessinerTexte('CPU  : 8-BIT RISC (REGISTRES A, B, C, D) 20 MHZ', 14, 34, 0b0001);
    this.vga.dessinerTexte('RAM  : 64 KO (ESPACE MEMOIRE 0x0000 - 0xFFFF)', 14, 44, 0b0001);
    this.vga.dessinerTexte('VRAM : 330x165 PIXELS (SIGNAL VIDEO VGA)', 14, 54, 0b0001);

    const u1 = this.clavier.estBranche ? 'CLAVIER' : 'LIBRE';
    const u2 = this.souris.estBranche ? 'SOURIS' : 'LIBRE';
    const u3 = this.hubUsb.cleUsb.estBranchee ? 'FLASH' : 'LIBRE';
    this.vga.dessinerTexte(`PORTS: USB1:${u1}  USB2:${u2}  USB3:${u3}`, 14, 64, 0b0001);

    // 3. Encadré d'information sur l'absence d'OS (Y: 76..106, H: 30px)
    this.vga.dessinerRect(14, 76, 302, 30, 0b0101, false);
    this.vga.dessinerTexte('STATUT : AUCUN SYSTEME D\'EXPLOITATION DETECTE', 22, 82, 0b0101);
    this.vga.dessinerTexte('Memoire vierge. Choisissez un programme a lancer.', 22, 93, 0b0110);

    // 4. Commandes d'action & Boutons interactifs (Y: 112..140)
    this.vga.dessinerTexte('INJECTION DE CODE EN MEMOIRE VIVE (RAM) :', 14, 112, 0b0010);

    // Bouton H : Hello World (X: 14..158, Y: 124..140)
    this.vga.dessinerRect(14, 124, 144, 16, 0b0011, false);
    this.vga.dessinerTexte('[H] HELLO WORLD', 28, 129, 0b0011);

    // Bouton B : Booter B-OS (X: 172..316, Y: 124..140)
    this.vga.dessinerRect(172, 124, 144, 16, 0b0001, false);
    this.vga.dessinerTexte('[B] BOOTER B-OS', 190, 129, 0b0001);

    // 5. Astuce inférieure (Y: 148)
    this.vga.dessinerTexte('Tapez H ou B au clavier, ou cliquez sur un bouton.', 14, 148, 0b1010);

    // Curseur souris
    this.vga.dessinerCurseurSouris(this.sourisX, this.sourisY);
    this.vga.rafraichirSignal();
  }

  /**
   * Écran d'exécution minimale "Hello World"
   */
  private rendreEcranHelloWorld(): void {
    this.vga.clear(0b0000);

    // Cadre général Hello World (Y: 10..152)
    this.vga.dessinerRect(14, 10, 302, 144, 0b0011, false);
    this.vga.dessinerTexte('=== PROGRAMME BAS-NIVEAU : HELLO WORLD ===', 24, 16, 0b0011);
    this.vga.dessinerLigne(24, 27, 306, 27, 0b1010);

    // Message principal
    this.vga.dessinerTexte('> HELLO WORLD !', 30, 38, 0b0001);
    this.vga.dessinerTexte('Le processeur a execute le code binaire injecte.', 30, 52, 0b0100);
    this.vga.dessinerTexte('Affichage VRAM : 330x165 px (1 pixel = 1 point)', 30, 64, 0b0110);
    this.vga.dessinerTexte('Police matrice : 5x7 points par caractere', 30, 76, 0b0010);
    this.vga.dessinerTexte('Palette binaire: 16 teintes (0b0000 a 0b1111)', 30, 88, 0b0011);
    this.vga.dessinerTexte('Peripheriques  : Port USB 1, USB 2, Sortie Audio', 30, 100, 0b0100);

    // Boutons de navigation (Y: 122..138)
    this.vga.dessinerRect(24, 122, 134, 16, 0b0001, false);
    this.vga.dessinerTexte('[B] BOOTER B-OS', 36, 127, 0b0001);

    this.vga.dessinerRect(172, 122, 134, 16, 0b0101, false);
    this.vga.dessinerTexte('[R] RETOUR BIOS', 184, 127, 0b0101);

    this.vga.dessinerCurseurSouris(this.sourisX, this.sourisY);
    this.vga.rafraichirSignal();
  }

  /**
   * Écran de l'OS complet de démonstration (B-OS v2.0)
   */
  private rendreEcranOsComplet(): void {
    this.vga.clear(0b0000);

    // 1. Barre supérieure du système d'exploitation (Y: 0..12)
    this.vga.dessinerRect(0, 0, 330, 13, 0b0011, false);
    this.vga.dessinerTexte('B-OS v2.0', 4, 3, 0b0011);
    this.vga.dessinerTexte('[ESC:BIOS]', 64, 3, 0b0101);

    // Indicateurs des ports physiques
    const usb1Color = this.clavier.estBranche ? 0b0001 : 0b0101;
    const usb2Color = this.souris.estBranche ? 0b0001 : 0b0101;
    const usb3Color = this.hubUsb.cleUsb.estBranchee ? 0b0001 : 0b1010;
    const vgaColor = this.vga.estConnecte ? 0b0001 : 0b0101;

    this.vga.dessinerTexte('USB1', 145, 3, usb1Color);
    this.vga.dessinerTexte('USB2', 178, 3, usb2Color);
    this.vga.dessinerTexte('USB3', 211, 3, usb3Color);
    this.vga.dessinerTexte('VGA', 246, 3, vgaColor);
    this.vga.dessinerTexte('AUD', 276, 3, 0b0001);
    this.vga.dessinerTexte('x', 315, 3, 0b0101);

    // 2. Barre d'onglets (Y: 15..26)
    const onglets: { id: OngletOS; label: string; x: number; w: number }[] = [
      { id: 'studio', label: '1.STUDIO', x: 4, w: 68 },
      { id: 'terminal', label: '2.CONSOLE', x: 76, w: 74 },
      { id: 'paint', label: '3.PAINT', x: 154, w: 66 },
      { id: 'io_inspector', label: '4.PORTS E/S', x: 224, w: 86 },
    ];

    onglets.forEach((tab) => {
      const actif = this.ongletActif === tab.id;
      const colBordure = actif ? 0b0010 : 0b1010;
      const colTexte = actif ? 0b0010 : 0b1010;
      this.vga.dessinerRect(tab.x, 15, tab.w, 11, colBordure, false);
      this.vga.dessinerTexte(tab.label, tab.x + 4, 17, colTexte);
    });

    // 3. Cadre de la fenêtre principale (Y: 28..150)
    this.vga.dessinerRect(2, 28, 326, 122, 0b0001, false);

    switch (this.ongletActif) {
      case 'studio':
        this.rendreFenetreStudio();
        break;
      case 'terminal':
        this.rendreFenetreTerminal();
        break;
      case 'paint':
        this.rendreFenetrePaint();
        break;
      case 'io_inspector':
        this.rendreFenetreIo();
        break;
    }

    // 4. Barre d'état inférieure (Y: 152..164)
    this.vga.dessinerRect(0, 152, 330, 13, 0b1010, false);
    this.vga.dessinerTexte(this.messageStatut.substring(0, 40), 4, 155, 0b0100);
    this.vga.dessinerTexte(`X:${this.sourisX} Y:${this.sourisY}`, 268, 155, 0b0010);

    // 5. Curseur de la souris
    this.vga.dessinerCurseurSouris(this.sourisX, this.sourisY);

    // Envoi du signal au moniteur
    this.vga.rafraichirSignal();
  }

  private rendreFenetreStudio(): void {
    this.vga.dessinerTexte('=== STUDIO DE LANGAGES & COMPILATEUR BINAIRE ===', 10, 32, 0b0011);

    if (this.derniereAppCompilee) {
      this.vga.dessinerTexte(`App : ${this.derniereAppCompilee.nomApplication}`, 10, 44, 0b0110);
      this.vga.dessinerTexte(`Taille : ${this.derniereAppCompilee.octets.length} octets`, 175, 44, 0b0100);

      this.vga.dessinerTexte('Bytecode binaire genere (0bXXXXXXXX) :', 10, 56, 0b0010);
      const ligne1 = this.derniereAppCompilee.bytecodeBinaire.slice(0, 8).join(' ');
      this.vga.dessinerTexte(ligne1 || '0b00000000', 10, 67, 0b0001);

      const ligne2 = this.derniereAppCompilee.bytecodeBinaire.slice(8, 16).join(' ');
      if (ligne2) {
        this.vga.dessinerTexte(ligne2, 10, 78, 0b0001);
      }
    }

    // Bouton virtuel interactif "EXECUTER"
    this.vga.dessinerRect(10, 93, 140, 16, 0b0010, false);
    this.vga.dessinerTexte('>> CLIQUEZ POUR EXECUTER <<', 14, 98, 0b0010);

    // Informations d'aide
    this.vga.dessinerTexte('Instructions : PRINT, PIXEL, RECT, LINE, BEEP, HALT', 10, 115, 0b0100);
    this.vga.dessinerTexte('Ouvrez le Studio ou les Reglages pour creer du code !', 10, 126, 0b1010);
  }

  private rendreFenetreTerminal(): void {
    this.vga.dessinerTexte('=== CONSOLE & LOGS DU SYSTEME B-OS ===', 10, 32, 0b0011);
    const logsAffiches = this.terminalLogs.slice(-10);
    let startY = 44;
    logsAffiches.forEach((log) => {
      this.vga.dessinerTexte(log.substring(0, 52), 10, startY, 0b0001);
      startY += 10;
    });
  }

  private rendreFenetrePaint(): void {
    this.vga.dessinerTexte('=== APPLICATION PAINT BINAIRE (330x165) ===', 10, 32, 0b0011);
    this.vga.dessinerTexte('Glissez le curseur ou cliquez pour dessiner au pixel', 10, 42, 0b1010);

    const couleursChoix = [
      { col: 0b0001, nom: 'VERT' },
      { col: 0b0010, nom: 'AMBRE' },
      { col: 0b0011, nom: 'CYAN' },
      { col: 0b0100, nom: 'BLANC' },
      { col: 0b0101, nom: 'ROUGE' },
    ];
    let colX = 10;
    couleursChoix.forEach((c) => {
      const estActive = this.couleurPinceauPaint === c.col;
      this.vga.dessinerRect(colX, 52, 40, 9, estActive ? 0b1011 : c.col, false);
      this.vga.dessinerTexte(c.nom, colX + 4, 53, c.col);
      colX += 45;
    });

    for (let py = 64; py < 145; py++) {
      for (let px = 6; px < 324; px++) {
        const val = this.paintCanvas[py] ? this.paintCanvas[py][px] : 0;
        if (val > 0) {
          this.vga.setPixel(px, py, val);
        }
      }
    }
  }

  private rendreFenetreIo(): void {
    this.vga.dessinerTexte('=== INSPECTEUR DES BUS & PORTS E/S ===', 10, 32, 0b0011);

    this.vga.dessinerTexte('PORT USB 1 (CLAVIER PHYSIQUE) :', 10, 44, 0b0010);
    const kbPacket = this.clavier.dernierPaquet
      ? `${this.clavier.dernierPaquet.octetBinaire} (Touche '${this.clavier.dernierPaquet.nomTouche}')`
      : '0b00000000 (En attente de frappe)';
    this.vga.dessinerTexte(kbPacket, 18, 54, 0b0001);

    this.vga.dessinerTexte('PORT USB 2 (SOURIS PHYSIQUE) :', 10, 68, 0b0010);
    const mousePacket = this.souris.dernierPaquet
      ? `BTN:${this.souris.dernierPaquet.octetBoutons} dX:${this.souris.dernierPaquet.octetDeltaX} dY:${this.souris.dernierPaquet.octetDeltaY}`
      : '0b00000000';
    this.vga.dessinerTexte(mousePacket, 18, 78, 0b0001);

    this.vga.dessinerTexte('PORT USB 3 (CLE FLASH VIRTUELLE) :', 10, 92, 0b0010);
    const usb3Stat = this.hubUsb.cleUsb.estBranchee
      ? `CONNECTEE · ${this.hubUsb.cleUsb.fichiers.length} fichiers binaires enregistres`
      : 'DEBRANCHEE';
    this.vga.dessinerTexte(usb3Stat, 18, 102, this.hubUsb.cleUsb.estBranchee ? 0b0001 : 0b0101);

    this.vga.dessinerTexte('SORTIE AUDIO JACK 3.5mm :', 10, 116, 0b0010);
    this.vga.dessinerTexte(`Dernier signal : ${this.audio.derniereCommandeBinaire}`, 18, 126, 0b0100);
  }

  /**
   * Gestionnaire de clic souris sur l'interface graphique
   */
  public gererClicSouris(x: number, y: number): void {
    this.sourisX = x;
    this.sourisY = y;
    this.audio.jouerSonClicSouris();

    // Clic de confirmation immédiate si le bandeau de sécurité est affiché
    if (this.alerteSecurite && y >= 136 && y <= 160 && x >= 14 && x <= 316) {
      if (this.actionConfirmeeEnAttente) {
        const action = this.actionConfirmeeEnAttente;
        this.alerteSecurite = null;
        this.actionConfirmeeEnAttente = null;
        action();
      }
      return;
    }

    // En mode BIOS Vierge
    if (this.modeDemarrage === 'bios_vierge') {
      if (y >= 120 && y <= 144) {
        if (x >= 10 && x <= 162) {
          this.verifierOuDeclencherAlerteSecurite('HELLO_WORLD', 'H', 'Charger Hello World', () => {
            this.chargerHelloWorld();
          });
          return;
        } else if (x >= 168 && x <= 322) {
          this.verifierOuDeclencherAlerteSecurite('BOOT_BOS', 'B', 'Booter B-OS', () => {
            this.chargerOsBureau();
          });
          return;
        }
      }
      return;
    }

    // En mode Hello World
    if (this.modeDemarrage === 'hello_world') {
      if (y >= 118 && y <= 142) {
        if (x >= 20 && x <= 162) {
          this.verifierOuDeclencherAlerteSecurite('BOOT_BOS', 'B', 'Booter B-OS', () => {
            this.chargerOsBureau();
          });
          return;
        } else if (x >= 168 && x <= 312) {
          this.verifierOuDeclencherAlerteSecurite('RESET_BIOS', 'ESC', 'Retour BIOS', () => {
            this.passerEnModeBiosVierge();
          });
          return;
        }
      }
      return;
    }

    // En mode OS complet
    if (this.estEnExecutionApp) {
      this.estEnExecutionApp = false;
      this.messageStatut = 'Retour au bureau B-OS.';
      this.rafraichirBureau();
      return;
    }

    // Clic sur [ESC:BIOS] ou [x] dans la barre supérieure de B-OS (Y: 0..14)
    if (y >= 0 && y <= 14) {
      if ((x >= 60 && x <= 125) || x >= 310) {
        this.verifierOuDeclencherAlerteSecurite('RESET_BIOS', 'ESC', 'Vider OS / Reset BIOS', () => {
          this.passerEnModeBiosVierge();
        });
        return;
      }
    }

    // Clic sur les onglets du haut (Y: 15..26)
    if (y >= 15 && y <= 26) {
      if (x >= 4 && x <= 72) this.ongletActif = 'studio';
      else if (x >= 76 && x <= 150) this.ongletActif = 'terminal';
      else if (x >= 154 && x <= 220) this.ongletActif = 'paint';
      else if (x >= 224 && x <= 310) this.ongletActif = 'io_inspector';
      this.rafraichirBureau();
      return;
    }

    // Clic dans l'onglet studio sur "EXECUTER"
    if (this.ongletActif === 'studio') {
      if (x >= 10 && x <= 150 && y >= 93 && y <= 109) {
        this.executerApplicationBinaire();
        return;
      }
    }

    // Clic dans Paint pour sélectionner une couleur
    if (this.ongletActif === 'paint' && y >= 52 && y <= 61) {
      if (x >= 10 && x < 50) this.couleurPinceauPaint = 0b0001;
      else if (x >= 55 && x < 95) this.couleurPinceauPaint = 0b0010;
      else if (x >= 100 && x < 140) this.couleurPinceauPaint = 0b0011;
      else if (x >= 145 && x < 185) this.couleurPinceauPaint = 0b0100;
      else if (x >= 190 && x < 230) this.couleurPinceauPaint = 0b0101;
      this.rafraichirBureau();
      return;
    }

    // Clic dans Paint pour dessiner
    if (this.ongletActif === 'paint' && y >= 64 && y < 145 && x >= 6 && x < 324) {
      this.paintCanvas[y][x] = this.couleurPinceauPaint;
      this.vga.setPixel(x, y, this.couleurPinceauPaint);
      this.rafraichirBureau();
    }
  }

  /**
   * Traitement du déplacement / glisser de la souris
   */
  public gererDeplacementSouris(x: number, y: number, clicEnCours: boolean): void {
    this.sourisX = x;
    this.sourisY = y;
    this.souris.deplacerVers(x, y);

    if (this.modeDemarrage === 'os_bureau' && clicEnCours && this.ongletActif === 'paint' && y >= 64 && y < 145 && x >= 6 && x < 324) {
      this.paintCanvas[y][x] = this.couleurPinceauPaint;
      if (x + 1 < 324) this.paintCanvas[y][x + 1] = this.couleurPinceauPaint;
      if (y + 1 < 145) this.paintCanvas[y + 1][x] = this.couleurPinceauPaint;
    }

    this.rafraichirBureau();
  }
}
