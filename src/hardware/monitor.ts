/**
 * Moniteur CRT Virtuel (Écran physique haute fidélité)
 * Résolution native : 330 colonnes x 165 lignes (1 pixel physique = 1 point)
 * Reçoit un signal vidéo binaire brut via le câble VGA
 * Supporte la gestion des couleurs en binaire (Palette binaire 16 couleurs 0b0000 - 0b1111)
 * ainsi que les modes phosphore monochrome classiques.
 */

export type PhosphorTheme = 'green' | 'amber' | 'cyan' | 'white';
export type ModeCouleur = 'couleur_binaire' | 'monochrome';

export interface CouleurRGB {
  r: number;
  g: number;
  b: number;
  nom: string;
  codeBinaire: string;
}

// Palette de 16 couleurs binaires (4 bits : 0b0000 à 0b1111)
export const PALETTE_BINAIRE: Record<number, CouleurRGB> = {
  0b0000: { r: 8, g: 12, b: 16, nom: 'Noir Fond CRT', codeBinaire: '0b0000' },
  0b0001: { r: 0, g: 255, b: 100, nom: 'Vert Phosphore P1', codeBinaire: '0b0001' },
  0b0010: { r: 255, g: 176, b: 0, nom: 'Ambre Chaud P3', codeBinaire: '0b0010' },
  0b0011: { r: 0, g: 229, b: 255, nom: 'Cyan Rétro', codeBinaire: '0b0011' },
  0b0100: { r: 240, g: 246, b: 252, nom: 'Blanc Papier', codeBinaire: '0b0100' },
  0b0101: { r: 255, g: 51, b: 68, nom: 'Rouge Alerte', codeBinaire: '0b0101' },
  0b0110: { r: 255, g: 234, b: 0, nom: 'Jaune Électrique', codeBinaire: '0b0110' },
  0b0111: { r: 224, g: 64, b: 251, nom: 'Magenta Néon', codeBinaire: '0b0111' },
  0b1000: { r: 41, g: 121, b: 255, nom: 'Bleu Cobalt', codeBinaire: '0b1000' },
  0b1001: { r: 0, g: 191, b: 165, nom: 'Vert Émeraude', codeBinaire: '0b1001' },
  0b1010: { r: 75, g: 90, b: 105, nom: 'Gris Atténué (Dim)', codeBinaire: '0b1010' },
  0b1011: { r: 255, g: 255, b: 255, nom: 'Curseur Surligné', codeBinaire: '0b1011' },
  0b1100: { r: 255, g: 145, b: 0, nom: 'Orange Mandarine', codeBinaire: '0b1100' },
  0b1101: { r: 255, g: 64, b: 129, nom: 'Rose Fluo', codeBinaire: '0b1101' },
  0b1110: { r: 128, g: 216, b: 255, nom: 'Bleu Ciel', codeBinaire: '0b1110' },
  0b1111: { r: 255, g: 255, b: 255, nom: 'Blanc Éclatant', codeBinaire: '0b1111' },
};

export const PHOSPHOR_THEMES: Record<PhosphorTheme, { r: number; g: number; b: number; name: string }> = {
  green: { r: 0, g: 255, b: 100, name: 'Vert Phosphore P1' },
  amber: { r: 255, g: 176, b: 0, name: 'Ambre Chaud P3' },
  cyan: { r: 0, g: 220, b: 255, name: 'Cyan Rétro' },
  white: { r: 240, g: 245, b: 255, name: 'Blanc Papier P4' },
};

export class Moniteur {
  public cols: number = 330;
  public rows: number = 165;
  public canvas: HTMLCanvasElement | null = null;
  public ctx: CanvasRenderingContext2D | null = null;
  public framebuffer: ImageData | null = null;
  public data: Uint8ClampedArray | null = null;
  public videoMemory: Uint8Array[] | null = null; // Reçoit le signal vidéo brut
  public curseur: { x: number; y: number } | null = null; // Curseur matériel overlay (hors VRAM)
  public theme: PhosphorTheme = 'green';
  public modeCouleur: ModeCouleur = 'couleur_binaire'; // Par défaut, affichage des couleurs binaires
  public isConnected: boolean = true; // Câble VGA branché ou non
  public isPowered: boolean = true;

  constructor(cols: number = 330, rows: number = 165) {
    this.cols = cols;
    this.rows = rows;
  }

  /**
   * Attache le canvas HTML au moniteur
   */
  public attacherCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (this.ctx) {
      this.ctx.imageSmoothingEnabled = false;
      this.framebuffer = this.ctx.createImageData(this.cols, this.rows);
      this.data = this.framebuffer.data;
    }
  }

  // Reçoit le signal vidéo du contrôleur VGA ainsi que la position du curseur matériel
  public recevoirSignal(vram: Uint8Array[], curseur: { x: number; y: number } | null = null): void {
    this.videoMemory = vram;
    this.curseur = curseur;
  }

  public setPixel(x: number, y: number, r: number, g: number, b: number): void {
    if (!this.data) return;
    if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
      const index = (y * this.cols + x) * 4;
      this.data[index] = r;
      this.data[index + 1] = g;
      this.data[index + 2] = b;
      this.data[index + 3] = 255;
    }
  }

  public clear(): void {
    if (!this.data) return;
    for (let i = 0; i < this.data.length; i += 4) {
      this.data[i] = 8;     // Fond noir CRT
      this.data[i + 1] = 12;
      this.data[i + 2] = 16;
      this.data[i + 3] = 255;
    }
  }

  /**
   * Boucle d'affichage physique de l'écran CRT
   */
  public render(): void {
    if (!this.ctx || !this.framebuffer) return;

    this.clear();

    if (!this.isPowered) {
      // Écran éteint : noir total
      this.ctx.putImageData(this.framebuffer, 0, 0);
      return;
    }

    if (!this.isConnected) {
      // Câble VGA débranché : mire "AUCUN SIGNAL VGA"
      this.dessinerMireDeconnectee();
      this.ctx.putImageData(this.framebuffer, 0, 0);
      return;
    }

    const themeColor = PHOSPHOR_THEMES[this.theme] || PHOSPHOR_THEMES.green;

    if (this.videoMemory) {
      for (let y = 0; y < this.rows; y++) {
        const row = this.videoMemory[y];
        if (!row) continue;
        for (let x = 0; x < this.cols; x++) {
          const val = row[x];
          if (val === 0) continue; // Fond noir déjà appliqué

          if (this.modeCouleur === 'couleur_binaire') {
            // Lecture de la palette binaire 4-bits
            const colEntry = PALETTE_BINAIRE[val & 0x0f] || PALETTE_BINAIRE[0b0001];
            this.setPixel(x, y, colEntry.r, colEntry.g, colEntry.b);
          } else {
            // Mode Monochrome Phosphore
            if (val === 1) {
              this.setPixel(x, y, themeColor.r, themeColor.g, themeColor.b);
            } else if (val === 2) {
              // Dimmed / 40%
              this.setPixel(x, y, Math.floor(themeColor.r * 0.45), Math.floor(themeColor.g * 0.45), Math.floor(themeColor.b * 0.45));
            } else if (val === 3 || val === 0b1011 || val === 0b0100) {
              // Curseur ou surbrillance blanc
              this.setPixel(x, y, 255, 255, 255);
            } else {
              this.setPixel(x, y, themeColor.r, themeColor.g, themeColor.b);
            }
          }
        }
      }
    }

    // Rendu du curseur matériel par-dessus l'image (garantit zéro traînée / aucun résidu dans la VRAM)
    if (this.curseur && this.curseur.x >= 0 && this.curseur.y >= 0) {
      this.dessinerCurseurOverlay(this.curseur.x, this.curseur.y);
    }

    this.ctx.putImageData(this.framebuffer, 0, 0);
  }

  /**
   * Trace le curseur de souris matériel directement dans le tampon d'affichage
   */
  private dessinerCurseurOverlay(mx: number, my: number): void {
    const curseur = [
      [1, 0, 0, 0, 0],
      [1, 1, 0, 0, 0],
      [1, 1, 1, 0, 0],
      [1, 1, 1, 1, 0],
      [1, 1, 1, 0, 0],
      [1, 0, 1, 1, 0],
      [0, 0, 0, 1, 1],
    ];

    for (let r = 0; r < curseur.length; r++) {
      const py = my + r;
      if (py >= 0 && py < this.rows) {
        for (let c = 0; c < curseur[r].length; c++) {
          const px = mx + c;
          if (px >= 0 && px < this.cols && curseur[r][c] === 1) {
            this.setPixel(px, py, 255, 255, 255);
          }
        }
      }
    }
  }

  private dessinerMireDeconnectee(): void {
    // Encadré central rouge d'absence de signal VGA
    const startX = Math.floor(this.cols / 2) - 45;
    const startY = Math.floor(this.rows / 2) - 10;
    for (let y = startY; y < startY + 20; y++) {
      for (let x = startX; x < startX + 90; x++) {
        if (x === startX || x === startX + 89 || y === startY || y === startY + 19) {
          this.setPixel(x, y, 255, 51, 68);
        }
      }
    }
  }
}
