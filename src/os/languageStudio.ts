/**
 * Studio de Construction de Langages de Programmation & Créateur d'Applications
 * Permet de définir les règles d'un langage, compiler en bytecode binaire (0bXXXXXXXX)
 * et exécuter l'application créée directement sur le PC virtuel
 */

export interface RegleSyntaxe {
  nom: string;
  motCle: string;
  opcodeBinaire: string; // Ex: "0b0001"
  description: string;
}

export interface ProgrammeCompileBinaire {
  nomApplication: string;
  sourceCode: string;
  bytecodeBinaire: string[]; // Liste d'octets binaires "0bXXXXXXXX"
  octets: number[];
  symboles: Record<string, number>;
  logsCompilation: string[];
  succes: boolean;
}

export class LanguageStudio {
  public nomLangage: string = 'BitScript v1.0';
  public regles: RegleSyntaxe[] = [
    { nom: 'AFFICHER', motCle: 'PRINT', opcodeBinaire: '0b00000001', description: 'Affiche un texte ou une valeur sur le moniteur' },
    { nom: 'DESSINER_PIXEL', motCle: 'PIXEL', opcodeBinaire: '0b00000010', description: 'Allume un pixel phosphore aux coordonnées (X, Y)' },
    { nom: 'RECTANGLE', motCle: 'RECT', opcodeBinaire: '0b00000011', description: 'Trace un rectangle (X, Y, Largeur, Hauteur)' },
    { nom: 'LIGNE', motCle: 'LINE', opcodeBinaire: '0b00000100', description: 'Trace une ligne binaire entre (X1, Y1) et (X2, Y2)' },
    { nom: 'EFFACER', motCle: 'CLEAR', opcodeBinaire: '0b00000101', description: 'Efface l\'écran' },
    { nom: 'SON_BIP', motCle: 'BEEP', opcodeBinaire: '0b00000110', description: 'Émet un bip audio à une fréquence donnée' },
    { nom: 'PAUSE', motCle: 'WAIT', opcodeBinaire: '0b00000111', description: 'Pause en millisecondes' },
    { nom: 'SAUT', motCle: 'GOTO', opcodeBinaire: '0b00001000', description: 'Saut inconditionnel vers une étiquette' },
    { nom: 'CONDITION', motCle: 'IF_BIT', opcodeBinaire: '0b00001001', description: 'Exécute si un bit mémoire est à 1' },
    { nom: 'ARRET', motCle: 'HALT', opcodeBinaire: '0b00001111', description: 'Termine l\'exécution de l\'application' },
  ];

  public modelesProgrammes: { nom: string; code: string; desc: string }[] = [
    {
      nom: 'Hello World Binaire',
      desc: 'Application d\'affichage de message et d\'encadrement phosphore',
      code: `CLEAR
RECT 40, 30, 250, 70
PRINT 60, 50, "HELLO WORLD VIRTUAL PC"
PRINT 60, 68, "TOUT FONCTIONNE EN BINAIRE !"
BEEP 520
HALT`,
    },
    {
      nom: 'Animation Ondes & Lignes',
      desc: 'Application de graphisme géométrique avec bip sonore',
      code: `CLEAR
LINE 20, 20, 310, 20
LINE 20, 145, 310, 145
PRINT 80, 40, "GENERATION GEOMETRIQUE"
RECT 110, 65, 110, 35
BEEP 440
BEEP 660
HALT`,
    },
    {
      nom: 'Synthétiseur Audio Binaire',
      desc: 'Séquence musicale sur la sortie audio Jack 3.5mm',
      code: `PRINT 50, 40, "LECTURE AUDIO EN COURS..."
BEEP 261
BEEP 329
BEEP 392
BEEP 523
PRINT 50, 60, "ACCORD MAJEUR JOUE AVEC SUCCES"
HALT`,
    },
    {
      nom: 'Constructeur de Langage Vide',
      desc: 'Modèle vierge pour concevoir vos propres instructions et applications',
      code: `// Mon application créée sur mesure
CLEAR
PRINT 20, 30, "NOUVEAU LANGAGE ACTIVE"
RECT 20, 45, 290, 80
PRINT 35, 75, "ECRIVEZ VOS COMMANDES ICI"
HALT`,
    },
  ];

  /**
   * Ajoute une nouvelle instruction / règle au langage
   */
  public ajouterRegle(motCle: string, description: string): RegleSyntaxe {
    const nextOpcodeNum = this.regles.length + 1;
    const opcodeBinaire = '0b' + nextOpcodeNum.toString(2).padStart(8, '0');
    const nouvelleRegle: RegleSyntaxe = {
      nom: motCle.toUpperCase(),
      motCle: motCle.toUpperCase(),
      opcodeBinaire,
      description,
    };
    this.regles.push(nouvelleRegle);
    return nouvelleRegle;
  }

  /**
   * Compilateur Binaire : traduit le code source en un flux pur d'octets binaires
   */
  public compilerEnBinaire(source: string, nomApp: string = 'MonApp'): ProgrammeCompileBinaire {
    const lignes = source.split('\n');
    const bytecodeBinaire: string[] = [];
    const octets: number[] = [];
    const symboles: Record<string, number> = {};
    const logsCompilation: string[] = [];

    logsCompilation.push(`[Compilateur] Démarrage de la compilation pour "${nomApp}"...`);
    logsCompilation.push(`[Compilateur] Analyse lexicale et génération du bytecode binaire...`);

    let adresse = 0;

    for (let i = 0; i < lignes.length; i++) {
      let ligne = lignes[i].trim();
      if (!ligne || ligne.startsWith('//') || ligne.startsWith('#')) {
        continue;
      }

      // Détection des étiquettes (ex: "BOUCLE:")
      if (ligne.endsWith(':')) {
        const nomEtiquette = ligne.substring(0, ligne.length - 1).trim();
        symboles[nomEtiquette] = adresse;
        logsCompilation.push(`  + Étiquette trouvée "${nomEtiquette}" à l'adresse 0x${adresse.toString(16).toUpperCase()}`);
        continue;
      }

      // Extraction commande et arguments
      let cmd = '';
      let argsStr = '';
      const firstSpace = ligne.indexOf(' ');
      if (firstSpace === -1) {
        cmd = ligne.toUpperCase();
      } else {
        cmd = ligne.substring(0, firstSpace).toUpperCase();
        argsStr = ligne.substring(firstSpace + 1).trim();
      }

      const regle = this.regles.find((r) => r.motCle === cmd);
      if (!regle) {
        logsCompilation.push(`  [ERREUR] Ligne ${i + 1} : Mot-clé inconnu "${cmd}"`);
        continue;
      }

      // Écriture de l'Opcode binaire de l'instruction
      const opNum = parseInt(regle.opcodeBinaire.replace('0b', ''), 2);
      octets.push(opNum);
      bytecodeBinaire.push(regle.opcodeBinaire);
      adresse++;

      // Analyse des arguments selon la commande
      if (cmd === 'CLEAR' || cmd === 'HALT') {
        // Pas d'arguments
      } else if (cmd === 'PRINT') {
        // PRINT x, y, "texte"
        const parts = this.separerArguments(argsStr);
        const x = parseInt(parts[0] || '0', 10) & 0xff;
        const y = parseInt(parts[1] || '0', 10) & 0xff;
        const texte = (parts[2] || '').replace(/^["']/, '').replace(/["']$/, '');

        // Encode X (1 octet) et Y (1 octet)
        this.ajouterOctet(x, octets, bytecodeBinaire);
        this.ajouterOctet(y, octets, bytecodeBinaire);
        adresse += 2;

        // Longueur de la chaîne (1 octet) + octets ASCII
        this.ajouterOctet(texte.length & 0xff, octets, bytecodeBinaire);
        adresse++;
        for (let c = 0; c < texte.length; c++) {
          this.ajouterOctet(texte.charCodeAt(c) & 0xff, octets, bytecodeBinaire);
          adresse++;
        }
      } else if (cmd === 'RECT') {
        // RECT x, y, w, h
        const parts = this.separerArguments(argsStr);
        const x = parseInt(parts[0] || '0', 10) & 0xff;
        const y = parseInt(parts[1] || '0', 10) & 0xff;
        const w = parseInt(parts[2] || '10', 10) & 0xff;
        const h = parseInt(parts[3] || '10', 10) & 0xff;
        this.ajouterOctet(x, octets, bytecodeBinaire);
        this.ajouterOctet(y, octets, bytecodeBinaire);
        this.ajouterOctet(w, octets, bytecodeBinaire);
        this.ajouterOctet(h, octets, bytecodeBinaire);
        adresse += 4;
      } else if (cmd === 'LINE') {
        // LINE x0, y0, x1, y1
        const parts = this.separerArguments(argsStr);
        const x0 = parseInt(parts[0] || '0', 10) & 0xff;
        const y0 = parseInt(parts[1] || '0', 10) & 0xff;
        const x1 = parseInt(parts[2] || '10', 10) & 0xff;
        const y1 = parseInt(parts[3] || '10', 10) & 0xff;
        this.ajouterOctet(x0, octets, bytecodeBinaire);
        this.ajouterOctet(y0, octets, bytecodeBinaire);
        this.ajouterOctet(x1, octets, bytecodeBinaire);
        this.ajouterOctet(y1, octets, bytecodeBinaire);
        adresse += 4;
      } else if (cmd === 'PIXEL') {
        // PIXEL x, y
        const parts = this.separerArguments(argsStr);
        const x = parseInt(parts[0] || '0', 10) & 0xff;
        const y = parseInt(parts[1] || '0', 10) & 0xff;
        this.ajouterOctet(x, octets, bytecodeBinaire);
        this.ajouterOctet(y, octets, bytecodeBinaire);
        adresse += 2;
      } else if (cmd === 'BEEP') {
        // BEEP freq
        const freq = parseInt(argsStr || '440', 10);
        // Fréquence encodée sur 2 octets (Poids fort + Poids faible)
        const msb = (freq >> 8) & 0xff;
        const lsb = freq & 0xff;
        this.ajouterOctet(msb, octets, bytecodeBinaire);
        this.ajouterOctet(lsb, octets, bytecodeBinaire);
        adresse += 2;
      }
    }

    logsCompilation.push(`[Compilateur] Succès ! ${octets.length} octets générés en binaire pur.`);

    return {
      nomApplication: nomApp,
      sourceCode: source,
      bytecodeBinaire,
      octets,
      symboles,
      logsCompilation,
      succes: true,
    };
  }

  private ajouterOctet(val: number, octets: number[], binaire: string[]): void {
    const clamped = val & 0xff;
    octets.push(clamped);
    binaire.push('0b' + clamped.toString(2).padStart(8, '0'));
  }

  private separerArguments(str: string): string[] {
    const res: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < str.length; i++) {
      const c = str[i];
      if (c === '"' || c === "'") {
        inQuotes = !inQuotes;
        cur += c;
      } else if (c === ',' && !inQuotes) {
        res.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    if (cur.trim()) {
      res.push(cur.trim());
    }
    return res;
  }
}
