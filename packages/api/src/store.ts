/** store.ts — the server home's persistence (ADR-06). File-backed StoragePort
 *  under .data/ (Postgres + object storage land later behind the same port).
 *  Plus the real wall-clock and crypto-rand ports (these use effects, so they
 *  live here, never in core). */
import { mkdirSync, readFileSync, writeFileSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import type { ClockPort, RandPort, StoragePort } from '@curriculumos/core';

export class FileStorage implements StoragePort {
  constructor(private dir: string) {
    mkdirSync(dir, { recursive: true });
  }
  private path(id: string): string {
    return join(this.dir, `${id.replace(/[^A-Za-z0-9_.-]/g, '_')}.json`);
  }
  async get(id: string): Promise<string | null> {
    const p = this.path(id);
    return existsSync(p) ? readFileSync(p, 'utf8') : null;
  }
  async put(id: string, value: string): Promise<void> {
    writeFileSync(this.path(id), value);
  }
  async list(): Promise<string[]> {
    if (!existsSync(this.dir)) return [];
    return readdirSync(this.dir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace(/\.json$/, ''));
  }
  async delete(id: string): Promise<void> {
    const p = this.path(id);
    if (existsSync(p)) rmSync(p);
  }
}

/** Real wall-clock — advances on its own (no tick needed). */
export class SystemClock implements ClockPort {
  nowISO(): string {
    return new Date().toISOString();
  }
  nowMs(): number {
    return Date.now();
  }
}

/** Crypto-backed randomness for the server home (ids, idempotency). */
export class CryptoRand implements RandPort {
  next(): number {
    return randomBytes(4).readUInt32BE(0) / 0x100000000;
  }
}
