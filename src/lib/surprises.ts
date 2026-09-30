export const KNIFE_TAPS = 7;
export const KNIFE_WINDOW_MS = 2800;
export const SHAKE_THRESHOLD = 1.8;

export type TapState = { count: number; startedAt: number };

export type Vec3 = { x: number; y: number; z: number };

/** Seven taps inside the window, or a long-press, unlocks the golden-knife case skin. */
export function applyTitleTap(state: TapState | null, now: number) {
  if (!state || now - state.startedAt > KNIFE_WINDOW_MS) {
    return { state: { count: 1, startedAt: now }, unlocked: false };
  }
  const count = state.count + 1;
  if (count >= KNIFE_TAPS) return { state: { count: 0, startedAt: now }, unlocked: true };
  return { state: { count, startedAt: state.startedAt }, unlocked: false };
}

export function accelerationDelta(previous: Vec3, next: Vec3) {
  const dx = next.x - previous.x;
  const dy = next.y - previous.y;
  const dz = next.z - previous.z;
  return Math.hypot(dx, dy, dz);
}

export function isShake(previous: Vec3, next: Vec3, threshold = SHAKE_THRESHOLD) {
  return accelerationDelta(previous, next) >= threshold;
}

/** Rare-or-better streak. A quốc dân / hiếm-below-rare roll (rarity < 2) breaks it. */
export function nextRareStreak(streak: number, rarity: number) {
  return rarity >= 2 ? streak + 1 : 0;
}

export function shouldCelebrateGold(rarity: number, reducedMotion: boolean) {
  return rarity >= 4 && !reducedMotion;
}

/** Haptics follow the sound toggle and reduced motion. */
export function shouldHaptic(soundOn: boolean, reducedMotion: boolean) {
  return soundOn && !reducedMotion;
}

export const GOLDEN_KNIFE = {
  name: 'Dao bếp vàng',
  sub: 'Case skin · không nằm trong pool xác suất',
  quip: 'StatTrak™ đã khóa vào con dao này. Món ăn vẫn do ngân sách quyết.',
} as const;
