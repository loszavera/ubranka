import { PrivateError } from './model.ts';

// A session-scoped semaphore bounds decoded images and network work together.
export class PhotoQueue {
  private active = 0;
  private waiting: (() => void)[] = [];
  async run<T>(signal: AbortSignal, work: () => Promise<T>): Promise<T> {
    await new Promise<void>((resolve, reject) => {
      const abort = () => { this.waiting = this.waiting.filter(value => value !== start); reject(new PrivateError('CANCELLED')); };
      const start = () => { signal.removeEventListener('abort', abort); if (signal.aborted) { reject(new PrivateError('CANCELLED')); return; } this.active++; resolve(); };
      if (signal.aborted) { reject(new PrivateError('CANCELLED')); return; }
      if (this.active < 2) start();
      else { this.waiting.push(start); signal.addEventListener('abort', abort, { once: true }); }
    });
    try { if (signal.aborted) throw new PrivateError('CANCELLED'); return await work(); }
    finally { this.active--; this.waiting.shift()?.(); }
  }
}
