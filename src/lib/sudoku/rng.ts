// Deterministic seeded pseudo-random number generator (mulberry32).
// Used so that a given level id / date always generates the same puzzle,
// enabling reproducible campaign levels and daily challenges without
// needing to persist every generated puzzle.

export function hashStringToSeed(input: string): number {
  let h = 1779033703 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class SeededRandom {
  private rand: () => number;

  constructor(seed: number | string) {
    const numericSeed = typeof seed === "string" ? hashStringToSeed(seed) : seed;
    this.rand = mulberry32(numericSeed);
  }

  next(): number {
    return this.rand();
  }

  nextInt(maxExclusive: number): number {
    return Math.floor(this.rand() * maxExclusive);
  }

  shuffle<T>(arr: T[]): T[] {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = this.nextInt(i + 1);
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
}
