# 📘 Guide Complet : Assembleur, Noyau d'OS & Applications VirtuArch

Bienvenue dans le guide de développement bas-niveau de l'ordinateur virtuel **VirtuArch**. Ce document détaille le fonctionnement interne du matériel, le jeu d'instructions assembleur, la création d'un système d'exploitation complet (de la table des interruptions jusqu'aux pilotes d'E/S), la persistance des données sur disque et avec l'index DBD, ainsi que la programmation d'applications graphiques et sonores.

---

## Sommaire
1. [Architecture Matérielle du Processeur RISC 8-Bit](#1-architecture-matérielle-du-processeur-risc-8-bit)
2. [Organisation de la Mémoire Vive (RAM 64 Ko)](#2-organisation-de-la-mémoire-vive-ram-64-ko)
3. [Jeu d'Instructions Assembleur (Opcodes & Codes Machine)](#3-jeu-dinstructions-assembleur-opcodes--codes-machine)
4. [Créer son Propre Système d'Exploitation (Kernel)](#4-créer-son-propre-système-dexploitation-kernel)
5. [Programmer les Paramètres & la Gestion des Périphériques E/S](#5-programmer-les-paramètres--la-gestion-des-périphériques-es)
6. [Persistance des Données : Disque Virtuel & Index DBD](#6-persistance-des-données--disque-virtuel--index-dbd)
7. [Créer des Applications (Graphiques, Souris, Clavier, Audio)](#7-créer-des-applications-graphiques-souris-clavier-audio)
8. [Format d'Injection JSON pour le Processeur](#8-format-dinjection-json-pour-le-processeur)
9. [Sécurité des Commandes Système (Anti-Fausses Manœuvres & Double-Appui)](#9-sécurité-des-commandes-système-anti-fausses-manœuvres--double-appui)
10. [Périphériques Haute-Fidélité & Synthèse Réaliste](#10-périphériques-haute-fidélité--synthèse-réaliste)

---

## 1. Architecture Matérielle du Processeur RISC 8-Bit

Le processeur simulé fonctionne selon le cycle de von Neumann en 5 phases micro-cadencées :
$$\text{FETCH} \longrightarrow \text{DECODE} \longrightarrow \text{EXECUTE} \longrightarrow \text{WRITEBACK} \longrightarrow \text{INTERRUPT\_CHECK}$$

### Les Registres du CPU
* **`PC` (Program Counter - 16 bits)** : Pointeur d'instruction. Indique l'adresse mémoire de la prochaine instruction à exécuter.
* **`SP` (Stack Pointer - 16 bits)** : Pointeur du sommet de la pile d'exécution. Démarre généralement à `0xFFFE` et décroît vers le bas à chaque `PUSH` ou `CALL`.
* **`R0, R1, R2, R3` (Registres Généraux - 16 bits)** : Utilisés pour stocker des variables temporaires, des pointeurs ou des valeurs de calcul.
* **`A` (Accumulateur - 16 bits)** : Registre principal pour les calculs de l'Unité Arithmétique et Logique (ALU).
* **`B` (Registre Mathématique Secondaire - 16 bits)** : Reçoit le second opérande pour les opérations de division, modulo ou multiplication.
* **`IX` (Index Register - 16 bits)** : Registre d'indexation pour parcourir des tableaux, des chaînes de caractères et les structures de données.
* **`IR` (Instruction Register)** : Contient le code mnémonique de l'instruction en cours de décodage.

### Les Drapeaux d'État (Flags)
Après chaque opération de l'ALU ou comparaison (`CMP`), le registre d'état met à jour 5 bits :
* **`Z` (Zero)** : Vrai si le résultat du calcul ou de la soustraction vaut 0.
* **`S` (Sign / Negative)** : Vrai si le résultat est négatif (bit de poids fort à 1).
* **`C` (Carry)** : Retenue lors d'une addition ou emprunt lors d'une soustraction.
* **`O` (Overflow)** : Débordement arithmétique signé.
* **`I` (Interrupts Enabled)** : Indique si les interruptions matérielles (`IRQ0`, `IRQ1`, `IRQ2`) sont acceptées (`STI`) ou masquées (`CLI`).

---

## 2. Organisation de la Mémoire Vive (RAM 64 Ko)

L'espace d'adressage total s'étend de `0x0000` à `0xFFFF` (65 536 adresses) :

| Plage d'adresses | Taille | Rôle & Contenu |
|---|---|---|
| `0x0000 - 0x0007` | 8 mots | **IVT (Interrupt Vector Table)** : Pointeurs vers les routines d'interruptions |
| `0x0008 - 0x007F` | 120 mots | **Variables Système & Paramètres** : Couleurs, config écran, tampons E/S |
| `0x0080 - 0x0FFF` | ~4 Ko | **Code du Système d'Exploitation (Noyau / OS)** : Séquence de boot et ordonnanceur |
| `0x1000 - 0x1FFF` | 4 Ko | **Index DBD (Database Disk / Memory Index)** : Arbre binaire de recherche rapide |
| `0x2000 - 0x7FFF` | 24 Ko | **Mémoire Données & Tampons de Secteurs de Disque** |
| `0x8000 - 0xFFFF` | 32 Ko | **Pile Système (Stack)** : Pousse vers le bas depuis `0xFFFE` |

---

## 3. Jeu d'Instructions Assembleur (Opcodes & Codes Machine)

### 3.1. Transfert de Données
* `MOV dst, src` : Copie la valeur d'un registre ou d'une constante vers un autre registre.
  * Exemple : `MOV A, 42` ou `MOV R0, A`
* `LOAD dst, addr` : Charge dans le registre `dst` la valeur stockée à l'adresse mémoire `addr`.
  * Exemple : `LOAD A, 0x0020` (charge la variable système en A)
* `STORE src, addr` : Écrit la valeur du registre `src` à l'adresse mémoire `addr`.
  * Exemple : `STORE A, 0x0020`
* `LOAD_IX dst, offset` : Adressage indirect indexé (`dst = RAM[IX + offset]`).
* `STORE_IX src, offset` : Écriture indirecte indexée (`RAM[IX + offset] = src`).
* `PUSH src` : Empile la valeur du registre `src` sur la pile (`SP = SP - 1; RAM[SP] = src`).
* `POP dst` : Dépile le sommet de la pile dans `dst` (`dst = RAM[SP]; SP = SP + 1`).

### 3.2. Arithmétique & Logique (ALU)
* `ADD dst, src` : `dst = dst + src`
* `SUB dst, src` : `dst = dst - src`
* `MUL dst, src` : Multiplie `dst` par `src`.
* `DIV dst, src` : Divise `dst` par `src` (quotient dans `dst`, reste dans `B`).
* `MOD dst, src` : Calcule le reste de la division entière.
* `INC dst` / `DEC dst` : Incrémente ou décrémente de 1.
* `AND dst, src` / `OR dst, src` / `XOR dst, src` : Opérations binaires bit à bit.
* `NOT dst` : Complément binaire à un (inverse tous les bits).
* `SHL dst, n` / `SHR dst, n` : Décalage binaire vers la gauche (multiplication par 2) ou vers la droite.

### 3.3. Contrôle de Flux & Sauts
* `CMP opA, opB` : Compare les deux valeurs en effectuant une soustraction interne et met à jour les drapeaux `Z`, `S`, `C`.
* `JMP label_ou_addr` : Saut inconditionnel.
* `JZ label_ou_addr` : Saut si Égal / Zéro (`Z == 1`).
* `JNZ label_ou_addr` : Saut si Différent / Non Zéro (`Z == 0`).
* `JG label_ou_addr` : Saut si Strictement Supérieur (`Z == 0 && S == 0`).
* `JL label_ou_addr` : Saut si Strictement Inférieur (`S == 1`).
* `CALL label_ou_addr` : Empile l'adresse de retour (`PC + 1`) sur la pile et saute à la fonction.
* `RET` : Dépile l'adresse de retour et reprend l'exécution.
* `HALT` : Arrête le cycle d'exécution du processeur.
* `NOP` : Ne fait rien pendant 1 micro-cycle (No Operation).

### 3.4. Gestion des Interruptions & Appels Système
* `CLI` : Désactive les interruptions matérielles (`I = 0`).
* `STI` : Active les interruptions matérielles (`I = 1`).
* `INT vector` : Déclenche une interruption logicielle (ex: `INT 4` pour un appel système Syscall).
* `RTI` : Retour d'interruption (restaure `PC` et les drapeaux sauvegardés).

### 3.5. Affichage Graphique VRAM (Écran 330×165, Palette 16 Couleurs)
* `CLEAR_SCREEN [couleur]` : Efface l'écran avec une couleur binaire (ex: `0b0000` = Noir).
* `DRAW_PIXEL x, y` : Allume le pixel aux coordonnées `(X, Y)` avec la couleur courante.
* `DRAW_CHAR char, x, y` : Dessine un caractère 5×7 à la position indiquée.
* `DRAW_TEXT "Mon texte", x, y` : Affiche une chaîne de caractères complète avec espacement 6px et interligne 9px.

### 3.6. Disque Virtuel & Index DBD
* `DISK_READ sector, ramAddr` : Copie les 64 octets du secteur disque `0..7` vers l'adresse RAM `ramAddr`.
* `DISK_WRITE sector, ramAddr` : Enregistre 64 octets depuis la RAM vers le secteur disque.
* `DBD_SET key, ptr` : Insère ou met à jour un enregistrement dans l'arbre binaire indexé en RAM.
* `DBD_GET key` : Recherche une clé et place le pointeur trouvé dans le registre `A`.

---

## 4. Créer son Propre Système d'Exploitation (Kernel)

Construire un système d'exploitation à partir de zéro se déroule en **4 grandes phases fondamentales** :

```
+-------------------------------------------------------+
| 1. INITIALISATION DE LA TABLE DES VECTEURS (IVT)      |
|    Vector 0 (Reset) -> Kernel Entrypoint (0x0080)     |
|    Vector 1 (Timer) -> Horloge / Ordonnanceur         |
|    Vector 2 (Clavier) -> Handler Frappe USB 1         |
|    Vector 4 (Syscall) -> Gestionnaire d'appels noyau  |
+-------------------------------------------------------+
                           |
                           v
+-------------------------------------------------------+
| 2. CONFIGURATION MATÉRIELLE & PILE D'APPELS           |
|    Initialiser SP = 0xFFFE                            |
|    Allumer l'écran VGA 330x165 (Port 0)               |
|    Activer les interruptions globales : STI           |
+-------------------------------------------------------+
                           |
                           v
+-------------------------------------------------------+
| 3. CHARGEMENT DE LA CONFIGURATION (PARAMÈTRES)        |
|    Lire le secteur 0 du disque dur vers la RAM        |
|    Charger la palette de couleurs et nom de machine   |
+-------------------------------------------------------+
                           |
                           v
+-------------------------------------------------------+
| 4. BOUCLE PRINCIPALE DU NOYAU (KERNEL EVENT LOOP)     |
|    Attente d'événements (clavier, souris, timer)      |
|    Dispatch vers l'application courante active        |
+-------------------------------------------------------+
```

### Exemple de Code Kernel Minimal en Assembleur

Voici un code de noyau complet prêt à être assemblé :

```assembly
; ========================================================
; MON PREMIER SYSTEME D'EXPLOITATION VIRTUARCH (KERNEL v1)
; ========================================================

; --- 1. VECTEURS D'INTERRUPTIONS (IVT à 0x0000) ---
    STORE 0x0080, 0x0000    ; Vector 0 : Reset / Démarrage pointe sur 0x0080
    STORE 0x0200, 0x0001    ; Vector 1 : Timer IRQ0 pointe sur 0x0200
    STORE 0x0220, 0x0002    ; Vector 2 : Clavier IRQ1 pointe sur 0x0220
    STORE 0x0250, 0x0004    ; Vector 4 : Syscalls SWI pointe sur 0x0250

; --- 2. SÉQUENCE DE DÉMARRAGE DU NOYAU (Adresse 0x0080) ---
_START:
    CLI                     ; Désactiver interruptions pendant la config
    MOV SP, 0xFFFE          ; Placer la pile tout en haut de la RAM

    ; Initialiser les paramètres système en RAM (0x0020 - 0x0025)
    STORE 0b0011, 0x0020    ; Couleur principale du système (Cyan 0b0011)
    STORE 0b0001, 0x0021    ; Couleur du texte (Vert Phosphore 0b0001)
    STORE 0, 0x0022         ; Compteur d'événements à 0

    ; Affichage de bienvenue sur l'écran VGA
    CLEAR_SCREEN 0b0000     ; Effacer avec fond noir
    DRAW_TEXT "=== MON SYSTEME D'EXPLOITATION KERNEL v1 ===", 15, 12
    DRAW_TEXT "Memoire vive 64 Ko initialisee. Pilotes prets.", 15, 26
    DRAW_TEXT "Appuyez sur une touche pour interagir.", 15, 40

    STI                     ; Activer les interruptions matérielles (I = 1)

; --- 3. BOUCLE PRINCIPALE D'ÉVÉNEMENTS (IDLE LOOP) ---
_KERNEL_LOOP:
    ; Le processeur tourne ici et attend les frappes clavier ou les timers
    NOP
    JMP _KERNEL_LOOP

; --- 4. GESTIONNAIRE DU TIMER MATÉRIEL (IRQ0 à 0x0200) ---
_IRQ0_TIMER_HANDLER:
    PUSH A
    LOAD A, 0x0022          ; Lire le compteur de temps
    INC A                   ; Incrémenter les micro-secondes
    STORE A, 0x0022
    POP A
    RTI                     ; Retour de l'interruption

; --- 5. GESTIONNAIRE DU CLAVIER USB (IRQ1 à 0x0220) ---
_IRQ1_KEYBOARD_HANDLER:
    PUSH A
    IN 1, A                 ; Lire l'octet binaire de touche depuis le Port USB 1
    STORE A, 0x0023         ; Sauvegarder la dernière touche tapée
    DRAW_TEXT "Touche pressee !", 15, 60
    POP A
    RTI

; --- 6. GESTIONNAIRE DES APPELS SYSTÈME (SWI à 0x0250) ---
_SYSCALL_HANDLER:
    ; Registre A contient le numéro d'appel système :
    ; 1 = AFFICHER TEXTE, 2 = DESSINER PIXEL, 3 = SAUVEGARDER DISQUE
    CMP A, 1
    JZ _SYS_PRINT
    CMP A, 2
    JZ _SYS_PIXEL
    RTI

_SYS_PRINT:
    ; R0 = X, R1 = Y
    DRAW_TEXT "APPEL SYSTEME REUSSI", 15, 80
    RTI

_SYS_PIXEL:
    DRAW_PIXEL 165, 82      ; Allume le pixel central
    RTI
```

---

## 5. Programmer les Paramètres & la Gestion des Périphériques E/S

Les paramètres de l'ordinateur correspondent à des variables d'état matérielles. Sur VirtuArch, elles sont accessibles de deux façons :
1. **Via les Ports d'Entrée/Sortie (`IN` et `OUT`)**
2. **Via une structure mémoire dédiée en RAM (`0x0020 - 0x007F`)**

### 5.1. Table des Ports Matériels VirtuArch

| Port | Périphérique physique | Lecture (`IN port, reg`) | Écriture (`OUT port, reg`) |
|---|---|---|---|
| **`0`** | Contrôleur Vidéo VGA | Statut VRAM / Rafraîchissement | Sélection de la couleur active (4 bits) |
| **`1`** | Port USB 1 (Clavier) | Dernier octet scancode reçu | Reset du tampon FIFO clavier |
| **`2`** | Port USB 2 (Souris) | Position X (8 bits bas) & Clics | Réglage sensibilité optique |
| **`3`** | Sortie Audio Jack 3.5mm | Statut de lecture sonore | Émission d'un bip (fréquence en Hz) |
| **`4`** | Port USB 3 (Clé Flash) | Statut de connexion de la clé | Sélection du secteur flash |

### 5.2. Structure des Paramètres en RAM (Struct Configuration)
Dans un OS propre, on réserve un bloc de configuration à l'adresse fixe `0x0020` :

```assembly
; Définition des offsets de la structure de configuration :
; 0x0020 : CONFIG_MAGIC       (doit valoir 0xCAFE pour valider la config)
; 0x0021 : CONFIG_COLOR_THEME (0b0001 = Vert, 0b0010 = Ambre, 0b0011 = Cyan)
; 0x0022 : CONFIG_SOUND_MUTE  (0 = Actif, 1 = Muet)
; 0x0023 : CONFIG_KEY_REPEAT  (Délai de répétition des touches)
; 0x0024 : CONFIG_USER_ID     (Identifiant de la session en cours)

_CHARGER_PARAMETRES:
    LOAD A, 0x0020
    CMP A, 0xCAFE
    JZ _PARAMETRES_VALIDES
    ; Si corrompu ou premier démarrage, appliquer les valeurs par défaut
    STORE 0xCAFE, 0x0020
    STORE 0b0001, 0x0021    ; Thème Vert Phosphore par défaut
    STORE 0, 0x0022         ; Son activé
_PARAMETRES_VALIDES:
    RET
```

---

## 6. Persistance des Données : Disque Virtuel & Index DBD

La mémoire vive (RAM) est volatile (elle se vide quand la machine s'éteint). Pour conserver vos scores, fichiers ou réglages, l'ordinateur dispose de **deux mécanismes complémentaires** :

### 6.1. Le Disque Virtuel (Stockage par Secteurs)
Le disque dur virtuel se compose de **8 secteurs de 64 octets** chacun (secteurs `0` à `7`).

#### Enregistrer des données sur le disque :
1. Préparez vos données dans un tampon mémoire (par exemple à l'adresse `0x2000`).
2. Appelez l'instruction `DISK_WRITE sector, ramAddr`.
3. Le contrôleur disque prend les 64 valeurs et les grave sur le secteur spécifié.

```assembly
_SAUVEGARDER_FICHIER:
    ; Écrit les données de 0x2000 vers le secteur 2 du disque
    STORE 65, 0x2000        ; Octet 1 : 'A'
    STORE 66, 0x2001        ; Octet 2 : 'B'
    STORE 67, 0x2002        ; Octet 3 : 'C'
    DISK_WRITE 2, 0x2000    ; Enregistrement immédiat sur disque
    RET
```

#### Recharger des données depuis le disque :
```assembly
_RESTAURER_FICHIER:
    ; Lit le secteur 2 vers la RAM à l'adresse 0x2000
    DISK_READ 2, 0x2000
    LOAD A, 0x2000          ; A contient maintenant 65 ('A')
    RET
```

### 6.2. L'Index DBD (Structure de Données Optimisée en RAM)
L'index DBD implémente un **Arbre Binaire de Recherche (Binary Search Tree)** directement gravé en RAM à partir de l'adresse `0x1000`.

Chaque entrée de l'index contient 6 champs :
* `key` : Clé numérique (identifiant unique de 0 à 65535).
* `recordPointer` : Adresse mémoire où se trouvent les données de cet élément.
* `leftChild` : Pointeur vers le sous-arbre gauche (clés inférieures).
* `rightChild` : Pointeur vers le sous-arbre droit (clés supérieures).
* `flags` : `1` si l'enregistrement est valide, `0` s'il est supprimé.

#### Pourquoi l'utiliser ?
Au lieu de parcourir les 64 Ko de mémoire un par un en temps linéaire $O(N)$, l'index DBD permet de retrouver n'importe quel fichier ou paramètre en **quelques micro-cycles seulement** ($O(\log N)$).

```assembly
; Inscription d'un document dans l'index DBD :
; Clé = 101, Adresse des données = 0x2500
DBD_SET 101, 0x2500

; Recherche ultra-rapide par clé :
DBD_GET 101
; Le registre A contient désormais 0x2500 !
LOAD R0, A                  ; R0 pointe vers les données
```

---

## 7. Créer des Applications (Graphiques, Souris, Clavier, Audio)

Pour concevoir une application, vous avez le choix entre deux approches :
1. **En Assembleur Bas-Niveau** (dans le simulateur CPU).
2. **Avec le Studio de Langages (BitScript)** (compilation directe en bytecode binaire `0bXXXXXXXX`).

### 7.1. Les Instructions Bytecode de BitScript

| Mot-clé | Opcode Binaire | Paramètres attendus | Description |
|---|---|---|---|
| `PRINT` | `0b00000001` | `x, y, "texte"` | Affiche une chaîne de caractères en police 5×7 |
| `PIXEL` | `0b00000010` | `x, y` | Allume le pixel phosphore aux coordonnées (X, Y) |
| `RECT`  | `0b00000011` | `x, y, w, h` | Dessine le contour d'un rectangle |
| `LINE`  | `0b00000100` | `x1, y1, x2, y2` | Trace un segment de droite entre deux points |
| `CLEAR` | `0b00000101` | *(aucun)* | Nettoie l'écran (fond noir `0b0000`) |
| `BEEP`  | `0b00000110` | `fréquence` | Émet un son sur le jack audio 3.5mm (ex: 440 Hz) |
| `WAIT`  | `0b00000111` | `millisecondes` | Marque une pause temporelle |
| `HALT`  | `0b00001111` | *(aucun)* | Termine l'exécution de l'application |

### 7.2. Exemple d'Application 1 : Synthétiseur Sonore & Formes
```
CLEAR
RECT 20, 20, 290, 125
PRINT 35, 35, "APPLICATION 1 : SYNTHETISEUR BINAIRE"
LINE 35, 48, 295, 48
PRINT 35, 60, "Joue la gamme Do-Mi-Sol-Do en carrees..."
BEEP 261
BEEP 329
BEEP 392
BEEP 523
PRINT 35, 80, "Accord complet joue avec succes sur Jack 3.5mm."
RECT 80, 100, 170, 25
PRINT 95, 108, "STATUS : EXECUTION OK"
HALT
```

### 7.3. Exemple d'Application 2 : Moniteur de Télémétrie Graphique
```
CLEAR
RECT 10, 10, 310, 145
PRINT 20, 22, "TABLEAU DE BORD DE SURVEILLANCE CPU"
LINE 20, 34, 300, 34
PRINT 20, 45, "REGISTRES : A=0x00FF  B=0x0042  PC=0x0080"
PRINT 20, 58, "MEMOIRE   : 64 Ko OK  ·  VRAM : 330x165 (1:1)"
PRINT 20, 71, "PORTS E/S : USB 1:CLAVIER  USB 2:SOURIS OPTIQUE"
LINE 20, 85, 300, 85
PRINT 20, 98, "DIAGNOSTIC SYSTEME : OPTIMAL"
BEEP 880
HALT
```

---

## 8. Format d'Injection JSON pour le Processeur

Pour injecter vos propres instructions directement dans le simulateur de CPU sans passer par un compilateur, vous pouvez importer une séquence au format JSON dans l'onglet **« Injecteur JSON / CPU »** des Paramètres.

### Schéma d'une Instruction en JSON :
```json
{
  "op": "NOM_OPCODE",
  "dst": "REGISTRE_DESTINATION_OU_CIBLE",
  "src": "REGISTRE_SOURCE_OU_VALEUR",
  "addr": 0,
  "comment": "Explication pedagogique"
}
```

### Exemple de Fichier JSON Complet Prêt à l'Emploi :
```json
[
  { "op": "CLI", "comment": "Desactive les interruptions au demarrage" },
  { "op": "MOV", "dst": "SP", "val": 65534, "comment": "Initialise le Stack Pointer a 0xFFFE" },
  { "op": "CLEAR_SCREEN", "val": 0, "comment": "Efface l'ecran VRAM 330x165 avec du noir" },
  { "op": "DRAW_TEXT", "text": "SYSTEME DEMARRE VIA JSON !", "dst": 40, "src": 30, "comment": "Affiche le titre" },
  { "op": "MOV", "dst": "A", "val": 10, "comment": "Charge 10 dans l'accumulateur A" },
  { "op": "MOV", "dst": "R0", "val": 32, "comment": "Charge 32 dans R0" },
  { "op": "ADD", "dst": "A", "src": "R0", "comment": "A = 10 + 32 = 42" },
  { "op": "STORE", "src": "A", "addr": 32, "comment": "Sauvegarde le resultat 42 a l'adresse 0x0020" },
  { "op": "DRAW_TEXT", "text": "CALCUL EFFECTUE : RESULTAT = 42", "dst": 40, "src": 55, "comment": "Affiche le statut" },
  { "op": "STI", "comment": "Active les interruptions pour les peripheriques" },
  { "op": "HALT", "comment": "Fin du programme de test" }
]
```

---

## 9. Sécurité des Commandes Système (Anti-Fausses Manœuvres & Double-Appui)

Dans les architectures matérielles réelles, déclencher une réinitialisation (*Cold Reset*) ou un changement de mode sur une simple frappe accidentelle (`ESC`, `B` ou `H`) est hautement risqué pour l'intégrité des données en RAM et le travail de l'utilisateur.

VirtuArch implémente un système de **confirmation armée avec temporisation de sécurité (3 secondes)** :

### 9.1. Fonctionnement du Double-Appui / Maintien Prolongé
1. **Premier appui sur une touche critique (`[B]`, `[H]` ou `[ESC]`) :**
   * L'action **n'est pas exécutée immédiatement**.
   * Le processeur arme une alerte de sécurité (`verifierOuDeclencherAlerteSecurite`).
   * Un avertisseur sonore d'alerte retentit sur la sortie audio (onde triangulaire 380 Hz).
   * Un bandeau d'alerte bicolore haute visibilité s'affiche en bas de l'écran VRAM :
     `! CONFIRMER : Reappuyez sur [X] (3s)`
   * Les boutons de l'interface clignotent en mode confirmation ambre.
2. **Second appui (ou maintien de la touche provoquant une répétition) sous 3 secondes :**
   * L'action critique est validée et exécutée (boot de B-OS, lancement de Hello World, ou réinitialisation en mode BIOS vierge).
   * La LED d'activité disque s'allume et le bruit mécanique du moteur pas-à-pas retentit.
3. **Expiration sans confirmation :**
   * Si 3 secondes s'écoulent sans second appui, l'alerte expire automatiquement et l'état en mémoire vive reste intact.
   * Vous pouvez également confirmer d'un simple clic direct sur le bandeau d'alerte jaune affiché sur le moniteur.

---

## 10. Périphériques Haute-Fidélité & Synthèse Réaliste

Pour offrir une expérience rétro-computing authentique, VirtuArch intègre des composants physiques simulés complets :

### 10.1. Moniteur CRT VirtuArch CRT-330
* **Bobine de Démagnétisation (Bouton « DÉMAG ») :**
  * Reproduit l'action de la bobine électromagnétique de dégaussage d'un vrai tube cathodique à masque perforé (shadow-mask).
  * Génère le grondement électromagnétique caractéristique 50 Hz/60 Hz décroissant (`jouerSonDegauss`), accompagné d'une secousse magnétique du signal vidéo et d'un flash phosphorescent sur l'écran en verre.
* **Sélecteur de Phosphore Matériel (Bouton « PHOSPHORE ») :**
  * **RGB :** Palette binaire standard de 16 couleurs (0b0000 à 0b1111).
  * **P1 VERT :** Phosphore vert Willemite (525 nm) des terminaux informatiques IBM et DEC VT100.
  * **P3 AMBRE :** Phosphore orange/ambre chaud à longue persistance rétinienne.
  * **P4 BLANC :** Phosphore blanc papier monochrome haute définition (type Apple Macintosh / Xerox).
* **Lignes de Balayage Cathodique (Bouton « SCAN ») :**
  * Active ou désactive le filtre d'entrelacement des lignes de balayage du faisceau d'électrons (Scanlines CRT).
* **LEDs d'Activité Réelles sur le Châssis :**
  * **LED PWR (Verte) :** Indique la mise sous tension de la THT (Très Haute Tension) et du contrôleur VGA.
  * **LED HDD (Ambre) :** S'illumine et clignote en temps réel à chaque écriture/lecture de secteur, chargement d'application, ou compilation de code source.
* **Interrupteur d'Alimentation Matériel :**
  * Permet d'allumer ou d'éteindre physiquement l'écran cathodique avec le bruit de relais associé.

### 10.2. Synthétiseur Audio Matériel (Sortie Jack 3.5mm)
* **Bruit de Moteur Pas-à-Pas (FDD/HDD Stepper Seek) :**
  * Génère le cliquetis mécanique typique (*« chhk-chhk-krrr »*) de déplacement de la tête de lecture sur les pistes du disque magnétique lors des accès physiques.
* **Switches Clavier Mécanique :**
  * Modélisation de l'impact tactile d'une touche avec transitoire d'attaque et légère variation fréquentielle organique pour chaque frappe.
* **Microswitches de Souris Optique :**
  * Deux clics distincts : 880 Hz pour le bouton gauche, 720 Hz pour le bouton droit.
* **Bip BIOS POST :**
  * Bip standard 800 Hz (120 ms) lors de l'initialisation réussie du matériel (*Power-On Self-Test*).

---

## 11. Vrai BIOS ROM, Mémoire Vierge (0x0000) et Bootloader USB Multi-Ports (Ports 1, 2, 3)

### 11.1. Philosophie du Matériel Brut et Mémoire Vierge
Dans un véritable ordinateur personnel classique (type IBM PC / AT ou station RISC), **aucun système d'exploitation de test n'est préchargé en mémoire vive (RAM)** à la sortie d'usine.
* **Toute la mémoire vive (64 Ko / 0x0000 à 0xFFFF) est initialisée strictement à zéro (`0x00000000`).**
* La puce **ROM BIOS** contient uniquement le firmware de base :
  1. Le **Power-On Self-Test (POST)** : vérification du processeur RISC 8-Bit, test de mémoire vive 64 Ko, détection du contrôleur vidéo VGA 330×165 et du synthétiseur audio.
  2. L'inventaire du contrôleur hôte **USB Hub à 3 ports matériels (Port 1, 2 et 3)**.
  3. Le **Bootloader de recherche de média bootable** : le BIOS balaie successivement les ports USB 1, 2 et 3 pour détecter une clé USB contenant un secteur de boot exécutable (`BOOT.BIN` / `KERNEL.SYS`).

### 11.2. Comportement en l'absence de Clé Bootable
Si aucun système personnalisé n'a été inséré sur les ports USB 1, 2 ou 3 :
* Le BIOS affiche l'écran de diagnostic POST complet :
  ```
  VIRTUARCH HARDWARE BIOS v2.4 (C) 1984-2026
  CPU  : 8-BIT RISC ARCHITECTURE @ 20.00 MHz ......... [OK]
  RAM  : 64 KB (0000h - FFFFh) CHECK: ALL ZERO 0x00 .. [OK]
  VGA  : VRAM 330x165 16-COLOR MATRIX ADAPTER ....... [OK]
  SND  : 1-CHANNEL AUDIO SYNTHESIZER 3.5mm JACK ...... [OK]
  USB  : SCANNING PORTS 1, 2, 3 FOR BOOTABLE MEDIA...
  P1: CLAVIER | P2: SOURIS | P3: LIBRE
  ```
* Suivi du message authentique d'erreur de disque :
  ```
  BOOT FAILURE : NON-SYSTEM DISK OR DISK ERROR
  AUCUN DISQUE BOOTABLE DETECTE DANS LES PORTS USB 1, 2 OU 3
  Memoire RAM = 0x0000 (Vierge). Aucun systeme precharge.
  ```

### 11.3. Workflow de Création et de Boot d'un OS Personnalisé
1. **Écriture du Système :** Ouvrez l'**Éditeur de Système d'Exploitation & Flasheur Clé USB** (Touche `[F3]` ou bouton dans la barre supérieure).
2. **Compilation Binaire :** Rédigez vos instructions (ex: `CLEAR`, `RECT`, `PRINT`, `LINE`, `PIXEL`, `BEEP`, `HALT` ou instructions Assembleur CPU).
3. **Flashage sur la Clé USB :** Cliquez sur **« 1. Flasher sur la Clé USB »** pour encoder le bytecode machine et le graver sur la clé de stockage virtuelle.
4. **Choix du Port USB :** Sélectionnez le port physique dans lequel insérer la clé :
   * **Port USB 1**
   * **Port USB 2**
   * **Port USB 3**
5. **Démarrage (Boot) :**
   * Appuyez sur **`[ENTRÉE]`** au clavier ou cliquez sur **« Booter Clé USB (Port X) »**.
   * Le BIOS fait retentir le bruit mécanique de lecture tête de disque (*« chhk-chhk-krrr »*) avec illumination de la LED ambre HDD.
   * Les octets binaires sont transférés directement en RAM à partir de l'adresse `0x0000`.
   * Le processeur saute à `PC = 0x0000` et votre propre système d'exploitation s'exécute sur l'écran !
6. **Retour au BIOS :** Appuyez sur **`[ESC]`** à tout moment pour revenir à la ROM BIOS.

### 11.4. Utilitaire BIOS CMOS Setup Utility ([F2])
En appuyant sur `[F2]` lors du POST, vous accédez à l'utilitaire classique bleu/ambre CMOS Setup :
* Ordre de priorité de boot : Port USB 1 → Port USB 2 → Port USB 3.
* Contrôle de la fréquence CPU (20.00 MHz) et de l'état mémoire à zéro.
* Diagnostic détaillé des périphériques connectés.

---

## Résumé des Raccourcis Clavier & Commandes Matérielles
* **`[ENTRÉE]`** : Rescanner les ports USB 1, 2, 3 et booter la clé USB si présente.
* **`[F2]`** : Ouvrir l'utilitaire **BIOS CMOS Setup Utility**.
* **`[F3]` ou `[E]`** : Ouvrir l'**Éditeur de Système d'Exploitation & Flasheur Clé USB**.
* **Double-Frappe `[ESC]` (ou maintien)** : Quitter le système personnalisé et réinitialiser en mode BIOS ROM.
* **Bouton DÉMAG** : Démagnétiser le moniteur CRT (bobine 50Hz + flash d'électrons).
* **Bouton PHOSPHORE** : Basculer entre 16 Couleurs RGB, Vert P1, Ambre P3 et Blanc P4.
* **Bouton SCAN** : Activer ou désactiver les lignes de balayage cathodique (Scanlines).
* **Menu « Ports & Réglages »** : Configuration avancée des ports USB 1, 2, 3, VGA, mémoire vive hexadécimale et registres CPU.


