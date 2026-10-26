import { ControleurVGA } from '../hardware/vga';
import { ClavierUSB } from '../hardware/keyboard';
import { SourisUSB } from '../hardware/mouse';
import { HubUSB } from '../hardware/usbHub';
import { SortieAudio } from '../hardware/audio';
import { LanguageStudio, ProgrammeCompileBinaire } from './languageStudio';

export type ModeDemarrage = 'bios_rom' | 'bios_setup' | 'os_personnalise';

export interface AlerteSecurite {
  action: 'BOOT_USB' | 'RESET_BIOS';
  nomTouche: string;
  titre: string;
  expireAt: number;
  compteurFrappes: number;
}

/**
 * Système d'Exploitation & BIOS Authentique VirtuArch (330x165)
 * - Aucune précharge de système de test (mémoire initialisée strictement à zéro).
 * - Vrai BIOS ROM matériel avec Power-On Self-Test (POST), vérification 64 KB à zéro,
 *   et balayage des Ports USB 1, 2 et 3.
 * - Si aucune clé bootable n'est présente, affiche l'erreur disque authentique.
 * - Exécute le système personnalisé de l'utilisateur dès qu'une clé flashée est insérée
 *   sur le Port 1, 2 ou 3.
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

  // L'ordinateur démarre TOUJOURS sur le vrai BIOS ROM (strictement aucun OS de base préchargé)
  public modeDemarrage: ModeDemarrage = 'bios_rom';

  public nomOsActif: string = '';
  public codeOsActif: string = '';
  public octetsOsActif: number[] = [];
  public messageStatut: string = 'BIOS ROM v2.4 · Aucun système préchargé';

  public terminalLogs: string[] = [
    'VIRTUARCH SYSTEM BIOS v2.4 (C) 1984-2026',
    'POST CPU 8-Bit RISC @ 20 MHz : OK',
    'POST RAM 64 Ko (0000h - FFFFh) : 100% VIERGE (0x00) OK',
    'POST VRAM 330x165 16-Couleurs : OK',
    'POST Contrôleur USB Hub Ports 1, 2, 3 : INITIALISÉ',
    'Scanning bus USB... Aucun système préchargé par défaut.',
  ];

  // Matrice de dessin VRAM utilisateur (330x165)
  public customVram: Uint8Array[];

  public alerteSecurite: AlerteSecurite | null = null;
  public actionConfirmeeEnAttente: (() => void) | null = null;
  public derniereErreurBoot: string | null = null;

  // Animation de clignotement curseur BIOS
  public curseurClignotant: boolean = true;

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

    // VRAM utilisateur initialisée strictement à zéro
    this.customVram = Array.from({ length: 165 }, () => new Uint8Array(330));
  }

  /**
   * Sécurité anti-fausse manoeuvre pour les actions critiques
   */
  public verifierOuDeclencherAlerteSecurite(
    action: 'BOOT_USB' | 'RESET_BIOS',
    nomTouche: string,
    titre: string,
    actionFinale: () => void
  ): boolean {
    const now = Date.now();
    if (this.alerteSecurite && this.alerteSecurite.action === action && now < this.alerteSecurite.expireAt) {
      this.alerteSecurite = null;
      this.actionConfirmeeEnAttente = null;
      actionFinale();
      return true;
    }

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
    this.vga.dessinerRect(14, 138, 302, 20, 0b0110, true);
    this.vga.dessinerRect(14, 138, 302, 20, 0b0101, false);
    this.vga.dessinerTexte(`! CONFIRMER : Reappuyez sur [${this.alerteSecurite.nomTouche}] (${resteSec}s)`, 20, 144, 0b0000);
  }

  /**
   * Retourne au BIOS POST
   */
  public passerEnModeBiosVierge(): void {
    this.modeDemarrage = 'bios_rom';
    this.messageStatut = 'BIOS ROM v2.4 · Aucun système chargé';
    this.audio.jouerBip(520, 0.1, 'square');
    this.rafraichirBureau();
  }

  /**
   * Ouvre l'écran BIOS CMOS Setup Utility
   */
  public ouvrirBiosSetup(): void {
    this.modeDemarrage = 'bios_setup';
    this.messageStatut = 'Configuration BIOS CMOS Setup';
    this.audio.jouerBip(660, 0.08, 'triangle');
    this.rafraichirBureau();
  }

  /**
   * Tente de booter depuis une clé USB connectée sur le Port 1, 2 ou 3
   */
  public tenterBootDepuisUsb(): boolean {
    const media = this.hubUsb.trouverCleBootable();
    if (!media) {
      this.derniereErreurBoot = 'Aucun disque bootable détecté sur les Ports USB 1, 2 ou 3.';
      this.terminalLogs.push('[BIOS] Boot échoué : aucun média bootable présent.');
      this.audio.jouerBip(220, 0.3, 'sawtooth');
      this.rafraichirBureau();
      return false;
    }

    this.derniereErreurBoot = null;
    this.booterSystemePersonnalise(
      media.cle.nomSysteme || 'OS_USB',
      media.cle.codeSource,
      media.cle.bytecode,
      media.port
    );
    return true;
  }

  /**
   * Boot effectif du système d'exploitation personnalisé depuis la clé USB
   */
  public booterSystemePersonnalise(
    nomSysteme: string,
    codeSource: string,
    bytecode: number[],
    portUsb: 1 | 2 | 3
  ): void {
    this.modeDemarrage = 'os_personnalise';
    this.nomOsActif = nomSysteme;
    this.codeOsActif = codeSource;
    this.octetsOsActif = [...bytecode];
    this.messageStatut = `"${nomSysteme}" booté depuis USB Port ${portUsb}`;

    this.terminalLogs.push(`[BIOS] Bootloader : Chargement de "${nomSysteme}" depuis USB Port ${portUsb}...`);
    this.terminalLogs.push(`[BIOS] ${bytecode.length} octets binaires copiés en RAM à l'adresse 0x0000.`);
    this.terminalLogs.push(`[BIOS] Saut d'exécution vers PC=0x0000.`);

    // Efface la VRAM et réinitialise le canvas utilisateur
    this.vga.clear(0b0000);
    for (let y = 0; y < 165; y++) {
      this.customVram[y].fill(0);
    }

    this.audio.jouerChimeDemarrage();
    this.executerBytecodeOsPersonnalise();
    this.rafraichirBureau();
  }

  /**
   * Exécute le bytecode du système personnalisé sur la VRAM 330x165
   */
  public executerBytecodeOsPersonnalise(): void {
    const octets = this.octetsOsActif;
    if (!octets || octets.length === 0) return;

    this.vga.clear(0b0000);

    let pc = 0;
    let securite = 0;

    while (pc < octets.length && securite < 3000) {
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
          this.vga.dessinerTexte(str, x, y, 0b0001); // Vert phosphore
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

    // Bandeau d'information discret en haut
    this.vga.dessinerRect(0, 0, 330, 11, 0b0011, false);
    this.vga.dessinerTexte(`SYSTEME: ${this.nomOsActif.toUpperCase()} (EXECUTION EN RAM)`, 4, 2, 0b0011);
    this.vga.dessinerTexte('[ESC: RETOUR BIOS]', 220, 2, 0b0101);

    // Barre d'état en bas
    this.vga.dessinerRect(0, 154, 330, 11, 0b1010, false);
    this.vga.dessinerTexte(`RAM: ${octets.length} octets charges a 0x0000`, 4, 156, 0b0110);
    this.vga.dessinerTexte(`SOURIS X:${this.sourisX} Y:${this.sourisY}`, 235, 156, 0b0010);
  }

  /**
   * Rendu de l'écran selon le mode courant
   */
  public rafraichirBureau(): void {
    if (this.modeDemarrage === 'bios_rom') {
      this.rendreEcranBiosAuthentique();
      this.dessinerBanniereSecuriteSiActive();
      this.vga.dessinerCurseurSouris(this.sourisX, this.sourisY);
      this.vga.rafraichirSignal();
      return;
    }

    if (this.modeDemarrage === 'bios_setup') {
      this.rendreEcranBiosSetup();
      this.dessinerBanniereSecuriteSiActive();
      this.vga.dessinerCurseurSouris(this.sourisX, this.sourisY);
      this.vga.rafraichirSignal();
      return;
    }

    // Mode 'os_personnalise'
    this.executerBytecodeOsPersonnalise();
    this.dessinerBanniereSecuriteSiActive();
    this.vga.dessinerCurseurSouris(this.sourisX, this.sourisY);
    this.vga.rafraichirSignal();
  }

  /**
   * Écran VRAI BIOS ROM Authentique
   * - POST complet des composants
   * - RAM vérifiée à zéro
   * - Scan des ports USB 1, 2, 3
   * - Erreur disque authentique si pas de clé bootable
   */
  private rendreEcranBiosAuthentique(): void {
    this.vga.clear(0b0000);

    // 1. En-tête BIOS
    this.vga.dessinerTexte('VIRTUARCH HARDWARE BIOS v2.4 (C) 1984-2026', 10, 6, 0b0011);
    this.vga.dessinerTexte('POWER-ON SELF-TEST (POST) INITIALIZATION', 10, 16, 0b0100);
    this.vga.dessinerLigne(10, 25, 320, 25, 0b1010);

    // 2. Diagnostics Matériels
    this.vga.dessinerTexte('CPU  : 8-BIT RISC ARCHITECTURE @ 20.00 MHz ......... [OK]', 10, 30, 0b0001);
    this.vga.dessinerTexte('RAM  : 64 KB (0000h - FFFFh) CHECK: ALL ZERO 0x00 .. [OK]', 10, 40, 0b0001);
    this.vga.dessinerTexte('VGA  : VRAM 330x165 16-COLOR MATRIX ADAPTER ....... [OK]', 10, 50, 0b0001);
    this.vga.dessinerTexte('SND  : 1-CHANNEL AUDIO SYNTHESIZER 3.5mm JACK ...... [OK]', 10, 60, 0b0001);

    // 3. Scan des 3 Ports USB
    const p1 = this.hubUsb.obtenirDescriptionPort(1);
    const p2 = this.hubUsb.obtenirDescriptionPort(2);
    const p3 = this.hubUsb.obtenirDescriptionPort(3);

    this.vga.dessinerTexte('USB  : SCANNING PORTS 1, 2, 3 FOR BOOTABLE MEDIA...', 10, 72, 0b0010);

    const descP1 = p1.connecte ? p1.peripherique.substring(0, 20) : 'LIBRE';
    const descP2 = p2.connecte ? p2.peripherique.substring(0, 20) : 'LIBRE';
    const descP3 = p3.connecte ? p3.peripherique.substring(0, 20) : 'LIBRE';

    this.vga.dessinerTexte(`P1: ${descP1} | P2: ${descP2} | P3: ${descP3}`, 10, 82, 0b0110);

    // 4. Détection du disque bootable
    const media = this.hubUsb.trouverCleBootable();

    if (media) {
      // Clé USB bootable détectée !
      this.vga.dessinerRect(10, 94, 310, 34, 0b0001, false);
      this.vga.dessinerTexte(`>> BOOTABLE MEDIA DETECTE SUR PORT USB ${media.port} !`, 16, 99, 0b0001);
      this.vga.dessinerTexte(`SYSTEME: ${media.cle.nomSysteme || 'OS_PERSO'} (${media.cle.tailleOctets} octets binaires)`, 16, 110, 0b0100);
      this.vga.dessinerTexte('Pret a booter et transferer en memoire vive 0x0000', 16, 120, 0b0110);

      // Bouton Booter
      this.vga.dessinerRect(10, 134, 150, 16, 0b0001, true);
      this.vga.dessinerTexte('>> [ENTREE] BOOTER USB <<', 18, 139, 0b0000);

      // Bouton Setup
      this.vga.dessinerRect(170, 134, 150, 16, 0b0011, false);
      this.vga.dessinerTexte('[F2] BIOS SETUP', 205, 139, 0b0011);
    } else {
      // Aucune clé bootable : Message d'erreur disque authentique
      this.vga.dessinerRect(10, 94, 310, 36, 0b0101, false);
      this.vga.dessinerTexte('BOOT FAILURE : NON-SYSTEM DISK OR DISK ERROR', 16, 98, 0b0101);
      this.vga.dessinerTexte('AUCUN DISQUE BOOTABLE DETECTE DANS LES PORTS USB 1, 2 OU 3', 16, 108, 0b0110);
      this.vga.dessinerTexte('Memoire RAM = 0x0000 (Vierge). Aucun systeme precharge.', 16, 118, 0b0100);

      // Commandes interactives
      this.vga.dessinerRect(10, 134, 150, 16, 0b0010, false);
      this.vga.dessinerTexte('[ENTREE] RESCANNER USB', 20, 139, 0b0010);

      this.vga.dessinerRect(170, 134, 150, 16, 0b0011, false);
      this.vga.dessinerTexte('[F2] BIOS SETUP', 205, 139, 0b0011);
    }

    // 5. Raccourcis clavier au bas de l'écran
    this.vga.dessinerTexte('[ENTREE]: Booter/Rescan  [F2]: Setup  [F3]: Editeur OS', 10, 154, 0b1010);
  }

  /**
   * Écran CMOS BIOS Setup Utility
   */
  private rendreEcranBiosSetup(): void {
    this.vga.clear(0b0010); // Fond bleu/ambre rétro pour BIOS Setup

    // Titre
    this.vga.dessinerRect(0, 0, 330, 14, 0b0011, true);
    this.vga.dessinerTexte('VIRTUARCH CMOS SETUP UTILITY - COPYRIGHT (C) 1984-2026', 10, 4, 0b0000);

    // Contenu Setup
    this.vga.dessinerRect(10, 20, 310, 126, 0b0000, true);
    this.vga.dessinerRect(10, 20, 310, 126, 0b0100, false);

    this.vga.dessinerTexte('--- CONFIGURATION MATERIELLE DU SYSTEME ---', 20, 26, 0b0011);

    this.vga.dessinerTexte('Ordre de Boot   : 1.USB Port 1 -> 2.USB Port 2 -> 3.USB Port 3', 20, 40, 0b0100);
    this.vga.dessinerTexte('Frequence CPU   : 20.00 MHz (Processeur RISC 8-Bit)', 20, 52, 0b0100);
    this.vga.dessinerTexte('Memoire RAM     : 64 Ko (Etat de depart: 100% Zero 0x00)', 20, 64, 0b0100);
    this.vga.dessinerTexte('Controleur VRAM : 330 x 165 Points (16 Couleurs Binaires)', 20, 76, 0b0100);

    const clePortStr = this.hubUsb.cleUsb.estBranchee
      ? `Port USB ${this.hubUsb.cleUsb.port} (${this.hubUsb.cleUsb.estBootable ? 'Bootable' : 'Vierge'})`
      : 'Ejectee / Absente';
    this.vga.dessinerTexte(`Cle USB Flash   : ${clePortStr}`, 20, 88, 0b0010);

    const media = this.hubUsb.trouverCleBootable();
    if (media) {
      this.vga.dessinerTexte(`Systeme Detecte : "${media.cle.nomSysteme}" (${media.cle.tailleOctets} octets)`, 20, 100, 0b0001);
    } else {
      this.vga.dessinerTexte('Systeme Detecte : AUCUN (Disque Vierge ou Absent)', 20, 100, 0b0101);
    }

    this.vga.dessinerTexte('Pour modifier ou creer un systeme : Utilisez l\'Editeur [F3]', 20, 116, 0b0110);
    this.vga.dessinerTexte('Puis flashez la cle et inserez-la sur le Port 1, 2 ou 3.', 20, 128, 0b0110);

    // Barre d'aide inférieure
    this.vga.dessinerRect(0, 152, 330, 13, 0b0011, true);
    this.vga.dessinerTexte('ESC: Quitter Setup et retourner au POST   ENTREE: Sauvegarder', 10, 155, 0b0000);
  }

  /**
   * Gestionnaire de clic souris sur le Moniteur Virtuel
   */
  public gererClicSouris(x: number, y: number): void {
    this.sourisX = x;
    this.sourisY = y;
    this.audio.jouerSonClicSouris();

    // Confirmation sécurité si bandeau actif
    if (this.alerteSecurite && y >= 136 && y <= 160 && x >= 14 && x <= 316) {
      if (this.actionConfirmeeEnAttente) {
        const action = this.actionConfirmeeEnAttente;
        this.alerteSecurite = null;
        this.actionConfirmeeEnAttente = null;
        action();
      }
      return;
    }

    // En mode BIOS ROM
    if (this.modeDemarrage === 'bios_rom') {
      const media = this.hubUsb.trouverCleBootable();

      // Clic sur le bouton de gauche (Booter ou Rescanner)
      if (y >= 132 && y <= 152 && x >= 10 && x <= 162) {
        if (media) {
          this.tenterBootDepuisUsb();
        } else {
          this.audio.jouerSonDisque(3);
          this.terminalLogs.push('[BIOS] Rescan des ports USB 1, 2, 3...');
          this.rafraichirBureau();
        }
        return;
      }

      // Clic sur [F2] BIOS SETUP
      if (y >= 132 && y <= 152 && x >= 168 && x <= 322) {
        this.ouvrirBiosSetup();
        return;
      }

      return;
    }

    // En mode BIOS Setup
    if (this.modeDemarrage === 'bios_setup') {
      // Clic pour quitter
      if (y >= 148) {
        this.passerEnModeBiosVierge();
        return;
      }
    }

    // En mode OS Personnalisé : clic sur [ESC: RETOUR BIOS]
    if (this.modeDemarrage === 'os_personnalise') {
      if (y <= 12 && x >= 210) {
        this.verifierOuDeclencherAlerteSecurite('RESET_BIOS', 'ESC', 'Retour au BIOS', () => {
          this.passerEnModeBiosVierge();
        });
        return;
      }
    }
  }

  /**
   * Déplacement de la souris
   */
  public gererDeplacementSouris(x: number, y: number, _clicEnCours: boolean): void {
    this.sourisX = x;
    this.sourisY = y;
    this.souris.deplacerVers(x, y);
    this.rafraichirBureau();
  }
}
