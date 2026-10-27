import { ControleurVGA } from '../hardware/vga';
import { ClavierUSB } from '../hardware/keyboard';
import { SourisUSB } from '../hardware/mouse';
import { HubUSB } from '../hardware/usbHub';
import { SortieAudio } from '../hardware/audio';
import { LanguageStudio, ProgrammeCompileBinaire, OPCODES } from './languageStudio';

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

  // État de la machine virtuelle pour animations temps réel et interactions
  public vmRegisters: number[] = [0, 0, 0, 0, 0, 0, 0, 0];
  public vmStack: number[] = [];
  public vmPc: number = 0;
  public vmRam: Uint8Array = new Uint8Array(65536);
  public vmEnExecution: boolean = false;
  public vmPauseJusquA: number = 0;
  public vmActiveColor: number = 0b0001;
  public vmClicDetecte: boolean = false;
  public autoBootCleUsb: boolean = true; // Démarre automatiquement sur USB Port 1 à l'allumage

  // Callbacks de contrôle d'alimentation depuis le bytecode de l'OS
  public onReboot?: () => void;
  public onShutdown?: () => void;

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
    this.terminalLogs.push(`[BIOS] Démarrage du processeur virtuel à l'adresse PC=0x0000.`);

    // Efface la VRAM et réinitialise l'état de la machine virtuelle
    this.vga.clear(0b0000);
    for (let y = 0; y < 165; y++) {
      this.customVram[y].fill(0);
    }

    this.vmRegisters = [0, 0, 0, 0, 0, 0, 0, 0];
    this.vmStack = [];
    this.vmPc = 0;
    this.vmRam.fill(0);
    this.vmActiveColor = 0b0001;
    this.vmEnExecution = true;
    this.vmPauseJusquA = 0;
    this.vmClicDetecte = false;

    this.audio.jouerChimeDemarrage();
    this.executerTrancheBytecode(4000);
    this.rafraichirBureau();
  }

  /**
   * Horloge d'animation et de rafraîchissement temps réel de l'OS personnalisé
   */
  public tickOs(): void {
    if (this.modeDemarrage === 'os_personnalise' && this.vmEnExecution) {
      this.executerTrancheBytecode(2500);
      this.rafraichirBureau();
    }
  }

  /**
   * Lit un opérande binaire (soit la valeur dynamique d'un registre R0..R7, soit un entier immédiat signé 16-bit)
   */
  public lireOperande(octets: number[]): number {
    const tag = octets[this.vmPc++] ?? 0;
    if (tag === 0x01) {
      // Registre R0..R7
      const reg = (octets[this.vmPc++] ?? 0) & 0x07;
      return this.vmRegisters[reg] ?? 0;
    } else {
      // Immédiat signé 16-bit (msb, lsb)
      const msb = octets[this.vmPc++] ?? 0;
      const lsb = octets[this.vmPc++] ?? 0;
      let val = (msb << 8) | lsb;
      if (val >= 0x8000) {
        val -= 0x10000;
      }
      return val;
    }
  }

  /**
   * Exécute une tranche d'instructions bytecode pour la frame en cours (Animation & Events)
   */
  public executerTrancheBytecode(maxInstructions: number = 3000): void {
    const octets = this.octetsOsActif;
    if (!octets || octets.length === 0 || !this.vmEnExecution) return;

    const now = Date.now();
    if (now < this.vmPauseJusquA) {
      return;
    }

    let cycles = 0;

    while (this.vmPc < octets.length && cycles < maxInstructions) {
      cycles++;
      const op = octets[this.vmPc++];

      switch (op) {
        case OPCODES.PRINT: {
          const x = this.lireOperande(octets);
          const y = this.lireOperande(octets);
          const colByte = octets[this.vmPc++] ?? 0xff;
          const len = octets[this.vmPc++] ?? 0;
          let str = '';
          for (let c = 0; c < len; c++) {
            str += String.fromCharCode(octets[this.vmPc++] || 32);
          }
          const col = colByte === 0xff ? this.vmActiveColor : (colByte & 0x0f);
          this.vga.dessinerTexte(str, x, y, col);
          break;
        }

        case OPCODES.PIXEL: {
          const x = this.lireOperande(octets);
          const y = this.lireOperande(octets);
          const colByte = octets[this.vmPc++] ?? 0xff;
          const col = colByte === 0xff ? this.vmActiveColor : (colByte & 0x0f);
          this.vga.setPixel(x, y, col);
          break;
        }

        case OPCODES.RECT: {
          const x = this.lireOperande(octets);
          const y = this.lireOperande(octets);
          const w = this.lireOperande(octets);
          const h = this.lireOperande(octets);
          const colByte = octets[this.vmPc++] ?? 0xff;
          const col = colByte === 0xff ? this.vmActiveColor : (colByte & 0x0f);
          this.vga.dessinerRect(x, y, w, h, col, false);
          break;
        }

        case OPCODES.FILLRECT: {
          const x = this.lireOperande(octets);
          const y = this.lireOperande(octets);
          const w = this.lireOperande(octets);
          const h = this.lireOperande(octets);
          const colByte = octets[this.vmPc++] ?? 0xff;
          const col = colByte === 0xff ? this.vmActiveColor : (colByte & 0x0f);
          this.vga.dessinerRectanglePlein(x, y, w, h, col);
          break;
        }

        case OPCODES.CIRCLE: {
          const xc = this.lireOperande(octets);
          const yc = this.lireOperande(octets);
          const r = this.lireOperande(octets);
          const colByte = octets[this.vmPc++] ?? 0xff;
          const col = colByte === 0xff ? this.vmActiveColor : (colByte & 0x0f);
          this.vga.dessinerCercle(xc, yc, r, col, false);
          break;
        }

        case OPCODES.FILLCIRCLE: {
          const xc = this.lireOperande(octets);
          const yc = this.lireOperande(octets);
          const r = this.lireOperande(octets);
          const colByte = octets[this.vmPc++] ?? 0xff;
          const col = colByte === 0xff ? this.vmActiveColor : (colByte & 0x0f);
          this.vga.dessinerCercle(xc, yc, r, col, true);
          break;
        }

        case OPCODES.LINE: {
          const x0 = this.lireOperande(octets);
          const y0 = this.lireOperande(octets);
          const x1 = this.lireOperande(octets);
          const y1 = this.lireOperande(octets);
          const colByte = octets[this.vmPc++] ?? 0xff;
          const col = colByte === 0xff ? this.vmActiveColor : (colByte & 0x0f);
          this.vga.dessinerLigne(x0, y0, x1, y1, col);
          break;
        }

        case OPCODES.CLEAR: {
          const col = (octets[this.vmPc++] ?? 0) & 0x0f;
          this.vga.clear(col);
          break;
        }

        case OPCODES.COLOR: {
          this.vmActiveColor = (octets[this.vmPc++] ?? 1) & 0x0f;
          break;
        }

        case OPCODES.BEEP: {
          const msb = octets[this.vmPc++] ?? 0;
          const lsb = octets[this.vmPc++] ?? 0;
          const durMs = octets[this.vmPc++] ?? 80;
          const freq = (msb << 8) | lsb;
          this.audio.jouerBip(freq > 0 ? freq : 440, durMs / 1000, 'square');
          break;
        }

        case OPCODES.SOUND: {
          const fxId = octets[this.vmPc++] ?? 1;
          this.audio.jouerEffetJeu(fxId);
          break;
        }

        case OPCODES.WAIT: {
          const ms = this.lireOperande(octets);
          this.vmPauseJusquA = Date.now() + Math.max(0, ms);
          return; // Met en pause pour la durée requise et rend la main
        }

        case OPCODES.REBOOT: {
          this.vmEnExecution = false;
          if (this.onReboot) this.onReboot();
          this.vmPc = octets.length;
          return;
        }

        case OPCODES.SHUTDOWN: {
          this.vmEnExecution = false;
          if (this.onShutdown) this.onShutdown();
          this.vmPc = octets.length;
          return;
        }

        case OPCODES.SET: {
          const reg = (octets[this.vmPc++] ?? 0) & 0x07;
          const val = this.lireOperande(octets);
          this.vmRegisters[reg] = val;
          break;
        }

        case OPCODES.ADD: {
          const reg = (octets[this.vmPc++] ?? 0) & 0x07;
          const val = this.lireOperande(octets);
          this.vmRegisters[reg] += val;
          break;
        }

        case OPCODES.SUB: {
          const reg = (octets[this.vmPc++] ?? 0) & 0x07;
          const val = this.lireOperande(octets);
          this.vmRegisters[reg] -= val;
          break;
        }

        case OPCODES.RANDOM: {
          const reg = (octets[this.vmPc++] ?? 0) & 0x07;
          const min = octets[this.vmPc++] ?? 0;
          const max = octets[this.vmPc++] ?? 255;
          this.vmRegisters[reg] = Math.floor(Math.random() * (max - min + 1)) + min;
          break;
        }

        case OPCODES.GOTO: {
          const msb = octets[this.vmPc++] ?? 0;
          const lsb = octets[this.vmPc++] ?? 0;
          const addr = (msb << 8) | lsb;
          if (addr < octets.length) {
            this.vmPc = addr;
          }
          break;
        }

        case OPCODES.IF_EQ: {
          const reg = (octets[this.vmPc++] ?? 0) & 0x07;
          const cmp = this.lireOperande(octets);
          const msb = octets[this.vmPc++] ?? 0;
          const lsb = octets[this.vmPc++] ?? 0;
          const addr = (msb << 8) | lsb;
          if (this.vmRegisters[reg] === cmp && addr < octets.length) {
            this.vmPc = addr;
          }
          break;
        }

        case OPCODES.IF_NE: {
          const reg = (octets[this.vmPc++] ?? 0) & 0x07;
          const cmp = this.lireOperande(octets);
          const msb = octets[this.vmPc++] ?? 0;
          const lsb = octets[this.vmPc++] ?? 0;
          const addr = (msb << 8) | lsb;
          if (this.vmRegisters[reg] !== cmp && addr < octets.length) {
            this.vmPc = addr;
          }
          break;
        }

        case OPCODES.IF_LT: {
          const reg = (octets[this.vmPc++] ?? 0) & 0x07;
          const cmp = this.lireOperande(octets);
          const msb = octets[this.vmPc++] ?? 0;
          const lsb = octets[this.vmPc++] ?? 0;
          const addr = (msb << 8) | lsb;
          if (this.vmRegisters[reg] < cmp && addr < octets.length) {
            this.vmPc = addr;
          }
          break;
        }

        case OPCODES.IF_GT: {
          const reg = (octets[this.vmPc++] ?? 0) & 0x07;
          const cmp = this.lireOperande(octets);
          const msb = octets[this.vmPc++] ?? 0;
          const lsb = octets[this.vmPc++] ?? 0;
          const addr = (msb << 8) | lsb;
          if (this.vmRegisters[reg] > cmp && addr < octets.length) {
            this.vmPc = addr;
          }
          break;
        }

        case OPCODES.CALL: {
          const msb = octets[this.vmPc++] ?? 0;
          const lsb = octets[this.vmPc++] ?? 0;
          const addr = (msb << 8) | lsb;
          if (this.vmStack.length < 128) {
            this.vmStack.push(this.vmPc);
          }
          if (addr < octets.length) {
            this.vmPc = addr;
          }
          break;
        }

        case OPCODES.RET: {
          if (this.vmStack.length > 0) {
            this.vmPc = this.vmStack.pop()!;
          } else {
            this.vmPc = octets.length;
          }
          break;
        }

        case OPCODES.PUSH: {
          const reg = (octets[this.vmPc++] ?? 0) & 0x07;
          if (this.vmStack.length < 128) {
            this.vmStack.push(this.vmRegisters[reg]);
          }
          break;
        }

        case OPCODES.POP: {
          const reg = (octets[this.vmPc++] ?? 0) & 0x07;
          if (this.vmStack.length > 0) {
            this.vmRegisters[reg] = this.vmStack.pop()!;
          }
          break;
        }

        case OPCODES.IF_CLICK: {
          const x = this.lireOperande(octets);
          const y = this.lireOperande(octets);
          const w = this.lireOperande(octets);
          const h = this.lireOperande(octets);
          const msb = octets[this.vmPc++] ?? 0;
          const lsb = octets[this.vmPc++] ?? 0;
          const addr = (msb << 8) | lsb;
          const inside = this.sourisX >= x && this.sourisX <= (x + w) && this.sourisY >= y && this.sourisY <= (y + h);
          const clicked = this.souris.clicGauche || this.vmClicDetecte;
          if (inside && clicked && addr < octets.length) {
            this.vmPc = addr;
            this.vmClicDetecte = false;
          }
          break;
        }

        case OPCODES.IF_KEY: {
          const codeTouche = octets[this.vmPc++] ?? 0;
          const msb = octets[this.vmPc++] ?? 0;
          const lsb = octets[this.vmPc++] ?? 0;
          const addr = (msb << 8) | lsb;
          const currentKey = this.clavier.dernierPaquet?.codeAscii ?? 0;
          const currentName = (this.clavier.dernierPaquet?.nomTouche || '').toUpperCase();
          const matches = currentKey === codeTouche ||
            (codeTouche >= 65 && codeTouche <= 90 && currentName === String.fromCharCode(codeTouche)) ||
            (codeTouche >= 48 && codeTouche <= 57 && currentName === String.fromCharCode(codeTouche));
          if (matches && addr < octets.length) {
            this.vmPc = addr;
          }
          break;
        }

        case OPCODES.GETKEY: {
          const reg = (octets[this.vmPc++] ?? 0) & 0x07;
          this.vmRegisters[reg] = this.clavier.dernierPaquet?.codeAscii ?? 0;
          break;
        }

        case OPCODES.MOUSE_X: {
          const reg = (octets[this.vmPc++] ?? 0) & 0x07;
          this.vmRegisters[reg] = Math.min(255, this.sourisX);
          break;
        }

        case OPCODES.MOUSE_Y: {
          const reg = (octets[this.vmPc++] ?? 0) & 0x07;
          this.vmRegisters[reg] = Math.min(255, this.sourisY);
          break;
        }

        case OPCODES.MOUSE_BTN: {
          const reg = (octets[this.vmPc++] ?? 0) & 0x07;
          this.vmRegisters[reg] = (this.souris.clicGauche || this.vmClicDetecte ? 1 : 0) | (this.souris.clicDroit ? 2 : 0);
          break;
        }

        case OPCODES.POKE: {
          const msb = octets[this.vmPc++] ?? 0;
          const lsb = octets[this.vmPc++] ?? 0;
          const val = octets[this.vmPc++] ?? 0;
          const addr = (msb << 8) | lsb;
          this.vmRam[addr] = val & 0xff;
          break;
        }

        case OPCODES.PEEK: {
          const msb = octets[this.vmPc++] ?? 0;
          const lsb = octets[this.vmPc++] ?? 0;
          const reg = (octets[this.vmPc++] ?? 0) & 0x07;
          const addr = (msb << 8) | lsb;
          this.vmRegisters[reg] = this.vmRam[addr] ?? 0;
          break;
        }

        case OPCODES.HALT: {
          this.vmEnExecution = false;
          this.vmPc = octets.length;
          return;
        }

        default:
          break;
      }
    }
  }

  /**
   * Alias de compatibilité
   */
  public executerBytecodeOsPersonnalise(): void {
    this.executerTrancheBytecode(4000);
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

    // En mode OS Personnalisé : le clic est transmis directement au processeur virtuel (IF_CLICK)
    if (this.modeDemarrage === 'os_personnalise') {
      this.vmClicDetecte = true;
      this.executerTrancheBytecode(2500);
      this.rafraichirBureau();
      this.vmClicDetecte = false;
      return;
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
