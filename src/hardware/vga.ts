import { Moniteur, PALETTE_BINAIRE } from './monitor';
import { FONT_5X7 } from './font5x7';

/**
 * Contrôleur Graphique VGA Matériel
 * Gère la mémoire vidéo VRAM binaire (matrice 330 x 165 avec pixels encodés en binaire)
 * Supporte le rendu des polices 5x7 (5 pixels large x 7 pixels haut)
 * et la gestion des couleurs en binaire (Palette 4-bits / 8-bits)
 */
export class ControleurVGA {
  public cols: number = 330;
  public rows: number = 165;
  public vram: Uint8Array[]; // Matrice binaire [y][x] : contient le code couleur binaire (0b0000 - 0b1111)
  public moniteur: Moniteur | null = null;
  public estConnecte: boolean = true; // Câble physique VGA branché
  public frameCount: number = 0;

  constructor(cols: number = 330, rows: number = 165) {
    this.cols = cols;
    this.rows = rows;
    this.vram = Array.from({ length: rows }, () => new Uint8Array(cols));
  }

  public connecterMoniteur(moniteur: Moniteur): void {
    this.moniteur = moniteur;
    moniteur.isConnected = this.estConnecte;
    this.rafraichirSignal();
  }

  public basculerCableVGA(): boolean {
    this.estConnecte = !this.estConnecte;
    if (this.moniteur) {
      this.moniteur.isConnected = this.estConnecte;
      this.moniteur.render();
    }
    return this.estConnecte;
  }

  public clear(couleurBinaire: number = 0b0000): void {
    const val = couleurBinaire & 0x0f;
    for (let y = 0; y < this.rows; y++) {
      this.vram[y].fill(val);
    }
  }

  public setPixel(x: number, y: number, couleurBinaire: number = 0b0001): void {
    const rx = Math.floor(x);
    const ry = Math.floor(y);
    if (rx >= 0 && rx < this.cols && ry >= 0 && ry < this.rows) {
      this.vram[ry][rx] = couleurBinaire & 0x0f;
    }
  }

  public getPixel(x: number, y: number): number {
    const rx = Math.floor(x);
    const ry = Math.floor(y);
    if (rx >= 0 && rx < this.cols && ry >= 0 && ry < this.rows) {
      return this.vram[ry][rx];
    }
    return 0;
  }

  public dessinerRect(
    x: number,
    y: number,
    w: number,
    h: number,
    couleurBinaire: number = 0b0001,
    plein: boolean = false
  ): void {
    const startX = Math.max(0, Math.min(this.cols - 1, Math.floor(x)));
    const startY = Math.max(0, Math.min(this.rows - 1, Math.floor(y)));
    const endX = Math.max(0, Math.min(this.cols, Math.floor(x + w)));
    const endY = Math.max(0, Math.min(this.rows, Math.floor(y + h)));
    const val = couleurBinaire & 0x0f;

    for (let py = startY; py < endY; py++) {
      for (let px = startX; px < endX; px++) {
        if (plein || px === startX || px === endX - 1 || py === startY || py === endY - 1) {
          this.vram[py][px] = val;
        }
      }
    }
  }

  public dessinerLigne(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    couleurBinaire: number = 0b0001
  ): void {
    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    let sx = x0 < x1 ? 1 : -1;
    let sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    const val = couleurBinaire & 0x0f;

    let cx = x0;
    let cy = y0;

    while (true) {
      this.setPixel(cx, cy, val);
      if (cx === x1 && cy === y1) break;
      let e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        cx += sx;
      }
      if (e2 < dx) {
        err += dx;
        cy += sy;
      }
    }
  }

  /**
   * Dessine un caractère avec la matrice 5x7 (5 pixels large x 7 pixels haut)
   */
  public dessinerCaractere(
    char: string,
    startX: number,
    startY: number,
    couleurBinaire: number = 0b0001
  ): void {
    const upper = char.toUpperCase();
    const glyph = FONT_5X7[upper] || FONT_5X7['?'] || [0b11111, 0b10001, 0b10001, 0b10001, 0b11111, 0b00000, 0b11111];
    const val = couleurBinaire & 0x0f;

    for (let r = 0; r < 7; r++) {
      const py = startY + r;
      if (py < 0 || py >= this.rows) continue;
      const bits = glyph[r] || 0;
      for (let c = 0; c < 5; c++) {
        const px = startX + c;
        if (px < 0 || px >= this.cols) continue;
        if ((bits & (1 << (4 - c))) !== 0) {
          this.vram[py][px] = val;
        }
      }
    }
  }

  /**
   * Rendu d'une ligne de texte en matrice 5x7
   * Largeur par caractère : 5px + 1px espacement = 6px
   * Hauteur par ligne : 7px + 2px interligne = 9px
   * Capacité : jusqu'à 55 colonnes x 18 lignes sur 330x165 !
   */
  public dessinerTexte(
    texte: string,
    startX: number,
    startY: number,
    couleurBinaire: number = 0b0001
  ): void {
    let cx = startX;
    let cy = startY;
    const val = couleurBinaire & 0x0f;

    for (let i = 0; i < texte.length; i++) {
      const ch = texte[i];
      if (ch === '\n') {
        cy += 9;
        cx = startX;
        continue;
      }
      // Ne déborde pas horizontalement sur la ligne du dessous pour éviter les collisions visuelles
      if (cx + 5 >= this.cols) {
        continue;
      }
      if (cy + 7 > this.rows) break;
      this.dessinerCaractere(ch, cx, cy, val);
      cx += 6; // 5 pixels de lettre + 1 pixel d'espacement
    }
  }

  /**
   * Dessine la flèche du curseur souris à l'écran (5x7)
   */
  public dessinerCurseurSouris(mx: number, my: number): void {
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
            this.vram[py][px] = 0b1011; // Blanc Surligné Curseur
          }
        }
      }
    }
  }

  /**
   * Envoie le signal vidéo VRAM binaire au moniteur
   */
  public rafraichirSignal(): void {
    if (this.moniteur && this.estConnecte) {
      this.moniteur.recevoirSignal(this.vram);
      this.moniteur.render();
      this.frameCount++;
    }
  }
}
