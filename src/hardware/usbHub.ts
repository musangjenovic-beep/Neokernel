import { ClavierUSB } from './keyboard';
import { SourisUSB } from './mouse';

/**
 * Contrôleur Hub USB à 3 ports matériels
 * - Port USB 1 : Clavier (ClavierUSB)
 * - Port USB 2 : Souris (SourisUSB)
 * - Port USB 3 : Clé de Stockage Binaire (Clé USB Flash Drive)
 */

export interface CleUsbStockage {
  nom: string;
  capaciteKo: number;
  fichiers: { nom: string; codeBinaire: string; tailleOctets: number }[];
  estBranchee: boolean;
}

export class HubUSB {
  public clavier: ClavierUSB;
  public souris: SourisUSB;
  public cleUsb: CleUsbStockage;
  public dernierFluxBinaire: {
    port: 1 | 2 | 3;
    donnees: string; // Ex: "0b01000001"
    description: string;
    timestamp: number;
  } | null = null;

  constructor(clavier: ClavierUSB, souris: SourisUSB) {
    this.clavier = clavier;
    this.souris = souris;
    this.cleUsb = {
      nom: 'FLASH_DRIVE_USB3',
      capaciteKo: 64,
      estBranchee: true,
      fichiers: [
        {
          nom: 'hello_world.bin',
          codeBinaire: '0b10100001 0b00000001 0b11000010',
          tailleOctets: 3,
        },
        {
          nom: 'custom_compiler.bin',
          codeBinaire: '0b11110000 0b00001111 0b10101010',
          tailleOctets: 3,
        },
      ],
    };
  }

  public basculerPort(port: 1 | 2 | 3): boolean {
    if (port === 1) {
      if (this.clavier.estBranche) this.clavier.debrancher();
      else this.clavier.brancher();
      return this.clavier.estBranche;
    } else if (port === 2) {
      if (this.souris.estBranche) this.souris.debrancher();
      else this.souris.brancher();
      return this.souris.estBranche;
    } else {
      this.cleUsb.estBranchee = !this.cleUsb.estBranchee;
      return this.cleUsb.estBranchee;
    }
  }

  public enregistrerFlux(port: 1 | 2 | 3, donnees: string, description: string): void {
    this.dernierFluxBinaire = {
      port,
      donnees,
      description,
      timestamp: Date.now(),
    };
  }
}
