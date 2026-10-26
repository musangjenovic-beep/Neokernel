import { ClavierUSB } from './keyboard';
import { SourisUSB } from './mouse';

/**
 * Spécification de la Clé USB Flash de Stockage & Boot
 * Peut être branchée sur le Port 1, Port 2 ou Port 3, ou être éjectée.
 */
export interface CleUsbStockage {
  nom: string;
  capaciteKo: number;
  port: 1 | 2 | 3 | null; // Port physique actuel (1, 2, 3 ou null si débranchée)
  estBranchee: boolean;
  estBootable: boolean;
  nomSysteme: string;
  codeSource: string;
  tailleOctets: number;
  bytecode: number[];
  bytecodeBinaire: string[];
  fichiers: {
    nom: string;
    tailleOctets: number;
    codeBinaire: string;
    estBootable?: boolean;
    contenuTexte?: string;
  }[];
}

/**
 * Contrôleur Hub USB à 3 ports physiques indépendants
 * N'importe quel port (1, 2 ou 3) peut accueillir la Clé USB de démarrage,
 * le clavier ou la souris.
 */
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

    // La clé USB démarre VIERGE (aucune précharge de système de test, mémoire vierge)
    this.cleUsb = {
      nom: 'FLASH_DRIVE_USB',
      capaciteKo: 64,
      port: 3, // Insérée par défaut dans le port 3 (ou modifiable vers 1, 2, ou null)
      estBranchee: true,
      estBootable: false, // Pas bootable au départ : l'utilisateur doit écrire son propre OS !
      nomSysteme: '',
      codeSource: '',
      tailleOctets: 0,
      bytecode: [],
      bytecodeBinaire: [],
      fichiers: [],
    };
  }

  /**
   * Bascule l'état d'un port physique (connecte/déconnecte clavier, souris ou clé)
   */
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
      if (this.cleUsb.estBranchee) {
        this.debrancherCle();
      } else {
        this.brancherCleSurPort(3);
      }
      return this.cleUsb.estBranchee;
    }
  }

  /**
   * Branche la clé USB sur le port spécifié (1, 2 ou 3)
   */
  public brancherCleSurPort(port: 1 | 2 | 3): void {
    this.cleUsb.port = port;
    this.cleUsb.estBranchee = true;
    this.enregistrerFlux(
      port,
      '0b11111111',
      `Clé USB Flash branchée sur le Port ${port} (${this.cleUsb.estBootable ? 'Bootable' : 'Vierge'})`
    );
  }

  /**
   * Éjecte physiquement la clé USB de n'importe quel port
   */
  public debrancherCle(): void {
    const ancienPort = this.cleUsb.port;
    this.cleUsb.port = null;
    this.cleUsb.estBranchee = false;
    if (ancienPort) {
      this.enregistrerFlux(ancienPort, '0b00000000', `Clé USB éjectée du Port ${ancienPort}`);
    }
  }

  /**
   * Flashe un nouveau système d'exploitation ou code personnalisé sur la clé USB
   */
  public flasherSystemeSurCle(
    nomSysteme: string,
    codeSource: string,
    bytecode: number[],
    bytecodeBinaire: string[]
  ): void {
    this.cleUsb.nomSysteme = nomSysteme || 'MON_OS_PERSO';
    this.cleUsb.codeSource = codeSource;
    this.cleUsb.bytecode = [...bytecode];
    this.cleUsb.bytecodeBinaire = [...bytecodeBinaire];
    this.cleUsb.tailleOctets = bytecode.length;
    this.cleUsb.estBootable = bytecode.length > 0;

    // Fichier kernel.sys inscrit sur la clé
    this.cleUsb.fichiers = [
      {
        nom: 'BOOT.BIN',
        tailleOctets: bytecode.length,
        codeBinaire: bytecodeBinaire.slice(0, 8).join(' '),
        estBootable: true,
        contenuTexte: codeSource,
      },
    ];

    if (this.cleUsb.port) {
      this.enregistrerFlux(
        this.cleUsb.port,
        bytecodeBinaire[0] || '0b00000001',
        `Écriture flash "${this.cleUsb.nomSysteme}" (${bytecode.length} octets)`
      );
    }
  }

  /**
   * Efface complètement la clé USB (retour à zéro)
   */
  public formaterCle(): void {
    this.cleUsb.nomSysteme = '';
    this.cleUsb.codeSource = '';
    this.cleUsb.bytecode = [];
    this.cleUsb.bytecodeBinaire = [];
    this.cleUsb.tailleOctets = 0;
    this.cleUsb.estBootable = false;
    this.cleUsb.fichiers = [];
  }

  /**
   * Recherche si un média bootable est présent sur les ports 1, 2 ou 3
   */
  public trouverCleBootable(): { port: 1 | 2 | 3; cle: CleUsbStockage } | null {
    if (this.cleUsb.estBranchee && this.cleUsb.port !== null && this.cleUsb.estBootable) {
      return { port: this.cleUsb.port, cle: this.cleUsb };
    }
    return null;
  }

  /**
   * Diagnostic de l'état de chaque port USB
   */
  public obtenirDescriptionPort(port: 1 | 2 | 3): {
    peripherique: string;
    connecte: boolean;
    estBootable: boolean;
  } {
    // Si la clé USB est branchée sur ce port
    if (this.cleUsb.estBranchee && this.cleUsb.port === port) {
      return {
        peripherique: `Clé USB Flash (${this.cleUsb.estBootable ? this.cleUsb.nomSysteme || 'Bootable' : 'Vierge'})`,
        connecte: true,
        estBootable: this.cleUsb.estBootable,
      };
    }

    if (port === 1) {
      return {
        peripherique: 'Clavier USB Matériel',
        connecte: this.clavier.estBranche,
        estBootable: false,
      };
    }

    if (port === 2) {
      return {
        peripherique: 'Souris USB Optique',
        connecte: this.souris.estBranche,
        estBootable: false,
      };
    }

    return {
      peripherique: 'Port USB Libre',
      connecte: false,
      estBootable: false,
    };
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
