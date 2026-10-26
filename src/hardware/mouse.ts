/**
 * Souris Optique USB Virtuelle (Périphérique d'entrée branché sur le Port USB 2)
 * Transmet des paquets binaires de 3 octets (Standard USB HID Mouse Packet : [Status, dX, dY])
 */

export interface PaquetSourisBinaire {
  octetBoutons: string; // Ex: "0b00000001" (Clic gauche)
  octetDeltaX: string;  // Ex: "0b00000010" (+2)
  octetDeltaY: string;  // Ex: "0b11111110" (-2 en complément à 2)
  x: number;
  y: number;
  clicGauche: boolean;
  clicDroit: boolean;
  timestamp: number;
}

export class SourisUSB {
  public portUSB: number = 2; // Branchée sur le port USB 2
  public estBranche: boolean = true;
  public x: number = 165; // Position initiale au centre de l'écran 330x165
  public y: number = 82;
  public maxX: number = 330;
  public maxY: number = 165;
  public clicGauche: boolean = false;
  public clicDroit: boolean = false;
  public dernierPaquet: PaquetSourisBinaire | null = null;
  public onInterruption?: () => void;

  constructor(maxX: number = 330, maxY: number = 165) {
    this.maxX = maxX;
    this.maxY = maxY;
    this.reinitialiser();
  }

  public reinitialiser(): void {
    this.x = Math.floor(this.maxX / 2);
    this.y = Math.floor(this.maxY / 2);
    this.clicGauche = false;
    this.clicDroit = false;
    this.emettrePaquet(0, 0);
  }

  /**
   * Déplace la souris avec delta ou coordonnées absolues
   */
  public deplacerVers(nouveauX: number, nouveauY: number): void {
    if (!this.estBranche) return;

    const clampedX = Math.max(0, Math.min(this.maxX - 1, Math.round(nouveauX)));
    const clampedY = Math.max(0, Math.min(this.maxY - 1, Math.round(nouveauY)));

    const dx = clampedX - this.x;
    const dy = clampedY - this.y;

    this.x = clampedX;
    this.y = clampedY;

    this.emettrePaquet(dx, dy);
  }

  public definirBoutons(gauche: boolean, droit: boolean): void {
    if (!this.estBranche) return;
    this.clicGauche = gauche;
    this.clicDroit = droit;
    this.emettrePaquet(0, 0);
  }

  /**
   * Encode la trame USB de 3 octets en représentation binaire
   */
  private emettrePaquet(dx: number, dy: number): void {
    // Octet 0 : Boutons [0, 0, 0, 0, 0, Milieu, Droit, Gauche]
    let statusByte = 0;
    if (this.clicGauche) statusByte |= 0b00000001;
    if (this.clicDroit) statusByte |= 0b00000010;

    // Octets 1 & 2 : dX et dY sur 8 bits signés
    const byteDx = (dx < 0 ? (256 + (dx % 256)) : dx) & 0xff;
    const byteDy = (dy < 0 ? (256 + (dy % 256)) : dy) & 0xff;

    this.dernierPaquet = {
      octetBoutons: '0b' + statusByte.toString(2).padStart(8, '0'),
      octetDeltaX: '0b' + byteDx.toString(2).padStart(8, '0'),
      octetDeltaY: '0b' + byteDy.toString(2).padStart(8, '0'),
      x: this.x,
      y: this.y,
      clicGauche: this.clicGauche,
      clicDroit: this.clicDroit,
      timestamp: Date.now(),
    };

    if (this.onInterruption) {
      this.onInterruption();
    }
  }

  public brancher(): void {
    this.estBranche = true;
  }

  public debrancher(): void {
    this.estBranche = false;
  }
}
