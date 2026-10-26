/**
 * Sortie Audio Matérielle Jack 3.5mm & Synthétiseur Rétro Haute Fidélité
 * Génère en temps réel des bruits mécaniques authentiques :
 * - Clavier mécanique (switch tactile & résonance)
 * - Microswitch souris optique
 * - Moteur pas-à-pas de tête de lecture disquette / disque dur (FDD/HDD seek)
 * - Bobine de démagnétisation CRT (Degauss coil 50Hz)
 * - Bip de validation BIOS POST (IBM standard)
 */

export class SortieAudio {
  public estBranche: boolean = true;
  public estMuet: boolean = false;
  public volume: number = 0.25; // 0..1
  public audioCtx: AudioContext | null = null;
  public derniereCommandeBinaire: string = '0b00000000';

  constructor() {}

  public initCtx(): AudioContext | null {
    if (this.estMuet || !this.estBranche) return null;
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  public jouerBip(frequence: number = 440, dureeSec: number = 0.08, type: OscillatorType = 'square'): void {
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequence, ctx.currentTime);

      gain.gain.setValueAtTime(this.volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dureeSec);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + dureeSec);

      // Enregistre l'octet binaire de commande audio
      const freqByte = Math.min(255, Math.floor(frequence / 10));
      this.derniereCommandeBinaire = '0b' + freqByte.toString(2).padStart(8, '0');
    } catch {
      // Audio context error fallback
    }
  }

  /**
   * Clic mécanique authentique de touche de clavier
   */
  public jouerSonTouche(): void {
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Bruit d'impact transitoire
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const baseFreq = 220 + Math.random() * 120;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.025);

      gain.gain.setValueAtTime(this.volume * 0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.025);
    } catch {
      // Audio fallback
    }
  }

  /**
   * Clic microswitch de la souris
   */
  public jouerSonClicSouris(estDroit: boolean = false): void {
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const freq = estDroit ? 720 : 880;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.018);

      gain.gain.setValueAtTime(this.volume * 0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.018);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.018);
    } catch {
      // Audio fallback
    }
  }

  /**
   * Bruit de tête de lecture disquette / disque dur (FDD/HDD stepper motor seek)
   */
  public jouerSonDisque(pas: number = 3): void {
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const stepCount = Math.min(6, Math.max(1, pas));
      for (let i = 0; i < stepCount; i++) {
        setTimeout(() => {
          if (!this.audioCtx || this.estMuet) return;
          try {
            const now = this.audioCtx.currentTime;
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(120 + Math.random() * 80, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.03);

            gain.gain.setValueAtTime(this.volume * 0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start(now);
            osc.stop(now + 0.03);
          } catch {}
        }, i * 45);
      }
    } catch {}
  }

  /**
   * Bobine de démagnétisation CRT (Degauss Coil)
   * Le fameux grondement magnétique "WHUUUUMM" suivi d'un déclin métallique
   */
  public jouerSonDegauss(): void {
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(60, now);
      osc1.frequency.exponentialRampToValueAtTime(30, now + 0.9);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(120, now);
      osc2.frequency.exponentialRampToValueAtTime(45, now + 0.9);

      gain.gain.setValueAtTime(this.volume * 0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.95);
      osc2.stop(now + 0.95);
    } catch {}
  }

  /**
   * Bip unique de validation BIOS POST (IBM standard 800Hz)
   */
  public jouerPostBeep(): void {
    this.jouerBip(800, 0.12, 'square');
  }

  /**
   * Bip d'erreur matérielle
   */
  public jouerErreurBip(): void {
    this.jouerBip(300, 0.15, 'sawtooth');
    setTimeout(() => this.jouerBip(220, 0.25, 'sawtooth'), 160);
  }

  public jouerChimeDemarrage(): void {
    setTimeout(() => this.jouerBip(261.63, 0.12, 'square'), 0);   // Do
    setTimeout(() => this.jouerBip(329.63, 0.12, 'square'), 120); // Mi
    setTimeout(() => this.jouerBip(392.00, 0.15, 'square'), 240); // Sol
    setTimeout(() => this.jouerBip(523.25, 0.35, 'square'), 380); // Do haut
  }
}
