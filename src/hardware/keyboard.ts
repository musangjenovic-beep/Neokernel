/**
 * Clavier USB Virtuel (Périphérique d'entrée branché sur le Port USB 1)
 * Transmet des paquets binaires de 8 bits (octets HID / scancodes 0bXXXXXXXX)
 */

export interface PaquetClavierBinaire {
  octetBinaire: string; // Ex: "0b01000001"
  codeAscii: number;    // 65
  nomTouche: string;    // "A"
  timestamp: number;
}

export class ClavierUSB {
  public portUSB: number = 1; // Branché sur le port USB 1
  public estBranche: boolean = true;
  public tampon: number[] = []; // Buffer FIFO d'octets binaires
  public maxTampon: number = 32;
  public dernierPaquet: PaquetClavierBinaire | null = null;
  public compteurFrappes: number = 0;
  public onInterruption?: () => void;

  constructor() {
    this.reinitialiser();
  }

  public reinitialiser(): void {
    this.tampon = [];
    this.dernierPaquet = null;
    this.compteurFrappes = 0;
  }

  /**
   * Envoie une frappe de touche encodée en binaire 8 bits
   */
  public frapperTouche(code: number, nomTouche?: string): boolean {
    if (!this.estBranche) {
      return false; // Clavier débranché du port USB
    }

    const octet = code & 0xff;
    this.tampon.push(octet);
    if (this.tampon.length > this.maxTampon) {
      this.tampon.shift();
    }

    const binaireStr = '0b' + octet.toString(2).padStart(8, '0');
    this.dernierPaquet = {
      octetBinaire: binaireStr,
      codeAscii: octet,
      nomTouche: nomTouche || String.fromCharCode(octet) || `Touche #${octet}`,
      timestamp: Date.now(),
    };
    this.compteurFrappes++;

    if (this.onInterruption) {
      this.onInterruption();
    }

    return true;
  }

  /**
   * Le contrôleur USB lit l'octet suivant du tampon (FIFO)
   */
  public lireOctet(): number | null {
    if (!this.estBranche || this.tampon.length === 0) {
      return null;
    }
    return this.tampon.shift() || null;
  }

  public brancher(): void {
    this.estBranche = true;
  }

  public debrancher(): void {
    this.estBranche = false;
    this.tampon = [];
  }
}
