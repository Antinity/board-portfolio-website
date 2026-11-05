/**
 * Real loading progress, shared between the 3D scene and the HTML loader.
 * Steps are counted once each by id, so React's dev double-mounts don't
 * inflate the count.
 */

const listeners = new Set();
const done = new Set();
let total = 1;
let ready = false;

const snapshot = () => ({ total, done: done.size, ready });
const emit = () => listeners.forEach((fn) => fn(snapshot()));

export const loading = {
  /** How many steps to expect (set once, before work starts). */
  expect(n) {
    total = Math.max(1, n);
    emit();
  },
  /** Mark one step finished. */
  step(id) {
    if (done.has(id)) return;
    done.add(id);
    emit();
  },
  /** Everything is uploaded and compiled; the scene can be shown. */
  finish() {
    ready = true;
    emit();
  },
  subscribe(fn) {
    listeners.add(fn);
    fn(snapshot());
    return () => listeners.delete(fn);
  },
};
