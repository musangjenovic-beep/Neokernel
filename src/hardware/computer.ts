import { Moniteur } from './monitor';
import { ControleurVGA } from './vga';
import { ClavierUSB } from './keyboard';
import { SourisUSB } from './mouse';
import { HubUSB } from './usbHub';
import { SortieAudio } from './audio';
import { BinaryOS } from '../os/binaryOs';
import { VirtualComputer } from '../core/cpu';

/**
 * Ordinateur Virtuel Matériel Complet
 * Assemble les périphériques physiques :
 * - 3 Ports USB : USB 1 (Clavier), USB 2 (Souris), USB 3 (Stockage Flash)
 * - 1 Port VGA vers le Moniteur (330 x 165 en signal binaire)
 * - 1 Sortie Audio Jack 3.5mm avec synthétiseur physique
 * - Système d'Exploitation (B-OS) avec Studio de création
 */
export class OrdinateurVirtuel {
  public moniteur: Moniteur;
  public vga: ControleurVGA;
  public clavier: ClavierUSB;
  public souris: SourisUSB;
  public hubUsb: HubUSB;
  public audio: SortieAudio;
  public os: BinaryOS;
  public cpu: VirtualComputer;

  public estAllume: boolean = true;
  public disqueEnAcces: boolean = false;
  public scanlinesActives: boolean = true;
  public degaussEnCours: boolean = false;

  private precedentClicGauche: boolean = false;
  private precedentClicDroit: boolean = false;
  private timerDisque: number | null = null;

  constructor() {
    this.moniteur = new Moniteur(330, 165);
    this.vga = new ControleurVGA(330, 165);
    this.clavier = new ClavierUSB();
    this.souris = new SourisUSB(330, 165);
    this.hubUsb = new HubUSB(this.clavier, this.souris);
    this.audio = new SortieAudio();
    this.cpu = new VirtualComputer();

    // Relie le câble VGA entre le contrôleur et le moniteur physique
    this.vga.connecterMoniteur(this.moniteur);

    // Initialise le système d'exploitation
    this.os = new BinaryOS(this.vga, this.clavier, this.souris, this.hubUsb, this.audio);

    // Liaisons d'interruption du clavier USB (Port 1)
    this.clavier.onInterruption = () => {
      this.audio.jouerSonTouche();
      const nomTouche = (this.clavier.dernierPaquet?.nomTouche || '').toUpperCase();
      const codeAscii = this.clavier.dernierPaquet?.codeAscii ?? 0;

      this.hubUsb.enregistrerFlux(
        1,
        this.clavier.dernierPaquet?.octetBinaire || '0b00000000',
        `Frappe '${this.clavier.dernierPaquet?.nomTouche}'`
      );

      const isKeyB = nomTouche === 'B' || nomTouche === 'KEYB' || codeAscii === 66 || codeAscii === 98;
      const isKeyH = nomTouche === 'H' || nomTouche === 'KEYH' || codeAscii === 72 || codeAscii === 104;
      const isKeyR = nomTouche === 'R' || nomTouche === 'KEYR' || nomTouche === 'ESC' || nomTouche === 'ESCAPE' || codeAscii === 82 || codeAscii === 114 || codeAscii === 27;

      // Traitement sécurisé des touches critiques au niveau BIOS (Double-appui ou maintien requis)
      if (this.os.modeDemarrage === 'bios_vierge') {
        if (isKeyH) {
          this.os.verifierOuDeclencherAlerteSecurite('HELLO_WORLD', 'H', 'Charger Hello World', () => {
            this.activerAccesDisque(400, 4);
            this.os.chargerHelloWorld();
          });
          return;
        } else if (isKeyB) {
          this.os.verifierOuDeclencherAlerteSecurite('BOOT_BOS', 'B', 'Booter B-OS', () => {
            this.activerAccesDisque(550, 5);
            this.os.chargerOsBureau();
          });
          return;
        }
      } else if (this.os.modeDemarrage === 'hello_world') {
        if (isKeyB) {
          this.os.verifierOuDeclencherAlerteSecurite('BOOT_BOS', 'B', 'Booter B-OS', () => {
            this.activerAccesDisque(550, 5);
            this.os.chargerOsBureau();
          });
          return;
        } else if (isKeyR) {
          this.os.verifierOuDeclencherAlerteSecurite('RESET_BIOS', 'ESC', 'Retour BIOS', () => {
            this.activerAccesDisque(250, 2);
            this.os.passerEnModeBiosVierge();
          });
          return;
        }
      } else if (this.os.modeDemarrage === 'os_bureau') {
        if (nomTouche === 'ESC' || nomTouche === 'ESCAPE' || codeAscii === 27) {
          this.os.verifierOuDeclencherAlerteSecurite('RESET_BIOS', 'ESC', 'Vider OS / Reset BIOS', () => {
            this.activerAccesDisque(250, 2);
            this.os.passerEnModeBiosVierge();
          });
          return;
        }
      }

      this.os.rafraichirBureau();
    };

    // Liaisons d'interruption de la souris USB (Port 2)
    this.souris.onInterruption = () => {
      if (this.souris.dernierPaquet) {
        this.hubUsb.enregistrerFlux(
          2,
          `${this.souris.dernierPaquet.octetBoutons} ${this.souris.dernierPaquet.octetDeltaX}`,
          `Souris X:${this.souris.x} Y:${this.souris.y}`
        );

        // Détection de front montant des clics avec sons microswitch
        if (this.souris.clicGauche && !this.precedentClicGauche) {
          this.audio.jouerSonClicSouris(false);
          this.os.gererClicSouris(this.souris.x, this.souris.y);
        } else if (this.souris.clicDroit && !this.precedentClicDroit) {
          this.audio.jouerSonClicSouris(true);
          this.os.gererClicSouris(this.souris.x, this.souris.y);
        }

        this.precedentClicGauche = this.souris.clicGauche;
        this.precedentClicDroit = this.souris.clicDroit;

        // Synchronisation directe des coordonnées avec l'OS
        this.os.sourisX = this.souris.x;
        this.os.sourisY = this.souris.y;
      }
      this.os.rafraichirBureau();
    };
  }

  /**
   * Simule l'accès physique à la mémoire / disque de stockage avec LED et moteur pas-à-pas
   */
  public activerAccesDisque(dureeMs: number = 300, pas: number = 3): void {
    this.disqueEnAcces = true;
    this.audio.jouerSonDisque(pas);

    if (this.timerDisque) {
      clearTimeout(this.timerDisque);
    }

    this.timerDisque = window.setTimeout(() => {
      this.disqueEnAcces = false;
      this.timerDisque = null;
    }, dureeMs);
  }

  /**
   * Déclenche une démagnétisation CRT authentique avec onde magnétique et flash
   */
  public declencherDegauss(onUpdate?: () => void): void {
    if (!this.moniteur.isPowered || !this.estAllume) return;
    this.degaussEnCours = true;
    this.audio.jouerSonDegauss();
    if (onUpdate) onUpdate();

    setTimeout(() => {
      this.degaussEnCours = false;
      if (onUpdate) onUpdate();
    }, 1100);
  }

  public demarrer(): void {
    this.estAllume = true;
    this.moniteur.isPowered = true;
    this.activerAccesDisque(600, 5);
    setTimeout(() => {
      this.audio.jouerPostBeep();
    }, 200);
    this.os.rafraichirBureau();
  }

  public eteindre(): void {
    this.estAllume = false;
    this.moniteur.isPowered = false;
    this.moniteur.render();
  }

  public redemarrer(): void {
    this.eteindre();
    setTimeout(() => {
      this.demarrer();
    }, 280);
  }
}
