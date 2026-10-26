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
 * - Hub USB à 3 ports physiques (Port 1, 2, 3) pouvant recevoir Clavier, Souris ou Clé USB Flash
 * - 1 Port VGA vers le Moniteur CRT (330 x 165 en signal binaire)
 * - 1 Sortie Audio Jack 3.5mm avec synthétiseur physique
 * - Vrai BIOS ROM matériel avec Power-On Self-Test (POST), vérification 64 KB RAM à zéro,
 *   et bootloader USB multi-ports sans système de test préchargé
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

  // Callback pour ouvrir l'éditeur externe si demandé au clavier ([F3] ou [E])
  public onDemandeEditeur?: () => void;

  constructor() {
    this.moniteur = new Moniteur(330, 165);
    this.vga = new ControleurVGA(330, 165);
    this.clavier = new ClavierUSB();
    this.souris = new SourisUSB(330, 165);
    this.hubUsb = new HubUSB(this.clavier, this.souris);
    this.audio = new SortieAudio();
    this.cpu = new VirtualComputer();

    // Mémoire RAM initialisée strictement à zéro (aucun système de test)
    this.cpu.reset(false);

    // Relie le câble VGA entre le contrôleur et le moniteur physique
    this.vga.connecterMoniteur(this.moniteur);

    // Initialise le système d'exploitation et BIOS ROM
    this.os = new BinaryOS(this.vga, this.clavier, this.souris, this.hubUsb, this.audio);

    // Liaisons d'interruption du clavier USB
    this.clavier.onInterruption = () => {
      this.audio.jouerSonTouche();
      const nomTouche = (this.clavier.dernierPaquet?.nomTouche || '').toUpperCase();
      const codeAscii = this.clavier.dernierPaquet?.codeAscii ?? 0;

      this.hubUsb.enregistrerFlux(
        1,
        this.clavier.dernierPaquet?.octetBinaire || '0b00000000',
        `Frappe '${this.clavier.dernierPaquet?.nomTouche}'`
      );

      const isEnter = nomTouche === 'ENTER' || nomTouche === 'ENTREE' || nomTouche === 'RETURN' || codeAscii === 13;
      const isF2 = nomTouche === 'F2' || codeAscii === 113;
      const isF3 = nomTouche === 'F3' || codeAscii === 114 || nomTouche === 'E';
      const isEsc = nomTouche === 'ESC' || nomTouche === 'ESCAPE' || codeAscii === 27;

      if (this.os.modeDemarrage === 'bios_rom') {
        if (isEnter) {
          this.activerAccesDisque(450, 4);
          this.os.tenterBootDepuisUsb();
          return;
        } else if (isF2) {
          this.os.ouvrirBiosSetup();
          return;
        } else if (isF3 && this.onDemandeEditeur) {
          this.onDemandeEditeur();
          return;
        }
      } else if (this.os.modeDemarrage === 'bios_setup') {
        if (isEsc || isEnter) {
          this.os.passerEnModeBiosVierge();
          return;
        }
      } else if (this.os.modeDemarrage === 'os_personnalise') {
        if (isEsc) {
          this.os.verifierOuDeclencherAlerteSecurite('RESET_BIOS', 'ESC', 'Retour au BIOS', () => {
            this.activerAccesDisque(250, 2);
            this.os.passerEnModeBiosVierge();
          });
          return;
        }
      }

      this.os.rafraichirBureau();
    };

    // Liaisons d'interruption de la souris USB
    this.souris.onInterruption = () => {
      if (this.souris.dernierPaquet) {
        this.hubUsb.enregistrerFlux(
          2,
          `${this.souris.dernierPaquet.octetBoutons} ${this.souris.dernierPaquet.octetDeltaX}`,
          `Souris X:${this.souris.x} Y:${this.souris.y}`
        );

        if (this.souris.clicGauche && !this.precedentClicGauche) {
          this.audio.jouerSonClicSouris(false);
          this.os.gererClicSouris(this.souris.x, this.souris.y);
        } else if (this.souris.clicDroit && !this.precedentClicDroit) {
          this.audio.jouerSonClicSouris(true);
          this.os.gererClicSouris(this.souris.x, this.souris.y);
        }

        this.precedentClicGauche = this.souris.clicGauche;
        this.precedentClicDroit = this.souris.clicDroit;

        this.os.sourisX = this.souris.x;
        this.os.sourisY = this.souris.y;
      }
      this.os.rafraichirBureau();
    };
  }

  /**
   * Simule l'accès physique à la mémoire / clé USB avec LED et son moteur pas-à-pas
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
   * Flashe le système personnalisé sur la clé USB et le branche sur le port désiré (1, 2 ou 3)
   */
  public flasherEtBrancherCleUsb(
    nomSysteme: string,
    codeSource: string,
    port: 1 | 2 | 3 = 3
  ): void {
    this.activerAccesDisque(450, 4);
    const prog = this.os.studio.compilerEnBinaire(codeSource, nomSysteme);
    this.hubUsb.flasherSystemeSurCle(nomSysteme, codeSource, prog.octets, prog.bytecodeBinaire);
    this.hubUsb.brancherCleSurPort(port);
    this.os.rafraichirBureau();
  }

  /**
   * Boot direct depuis la clé USB
   */
  public booterDepuisCle(): boolean {
    this.activerAccesDisque(600, 5);
    const res = this.os.tenterBootDepuisUsb();
    if (res) {
      // Inscription du bytecode dans la mémoire CPU pour synchronisation
      const media = this.hubUsb.trouverCleBootable();
      if (media && media.cle.bytecode.length > 0) {
        for (let i = 0; i < media.cle.bytecode.length; i++) {
          this.cpu.memory.write(0x0000 + i, media.cle.bytecode[i]);
        }
      }
    }
    return res;
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
    this.cpu.reset(false);
    setTimeout(() => {
      this.demarrer();
    }, 280);
  }
}
