import {
  createAudioPlayer,
  setAudioModeAsync,
  setIsAudioActiveAsync,
  type AudioPlayer,
} from 'expo-audio';
import { ASSET_BASE } from './theme';

export const SOUND_NAMES = [
  'csgo_ui_crate_open',
  'csgo_ui_crate_item_scroll',
  'item_reveal3_rare',
  'item_reveal4_mythical',
  'item_reveal5_legendary',
  'item_reveal6_ancient',
] as const;

export type CaseSound = (typeof SOUND_NAMES)[number];

function uriFor(name: CaseSound) {
  return `${ASSET_BASE}/sounds/${name}.mp3`;
}

/** Gesture-unlocked SFX. Ticks round-robin a small pool so overlaps stay cheap. */
export class CaseAudio {
  private players = new Map<CaseSound, AudioPlayer[]>();
  private cursor = new Map<CaseSound, number>();
  private muted = false;
  private disposed = false;
  private activated = false;

  async preload() {
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        interruptionMode: 'mixWithOthers',
        shouldPlayInBackground: false,
      });
    } catch {
      /* Audio setup never blocks opening a case. */
    }
    for (const name of SOUND_NAMES) {
      if (this.disposed) return;
      const copies = name === 'csgo_ui_crate_item_scroll' ? 3 : 1;
      const list: AudioPlayer[] = [];
      for (let i = 0; i < copies; i++) {
        try {
          const player = createAudioPlayer(
            { uri: uriFor(name) },
            { downloadFirst: true, updateInterval: 1000 },
          );
          player.volume = 0.65;
          list.push(player);
        } catch {
          /* Missing SFX is non-fatal. */
        }
      }
      this.players.set(name, list);
      this.cursor.set(name, 0);
    }
  }

  unlock() {
    if (this.disposed || this.muted) return;
    this.activated = true;
    void setIsAudioActiveAsync(true).catch(() => {});
  }

  play(name: CaseSound) {
    if (this.disposed || this.muted || !this.activated) return;
    const list = this.players.get(name);
    if (!list?.length) return;
    const index = this.cursor.get(name) ?? 0;
    this.cursor.set(name, (index + 1) % list.length);
    const player = list[index];
    void player
      .seekTo(0)
      .then(() => {
        if (!this.disposed && !this.muted) player.play();
      })
      .catch(() => {});
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (muted) this.pause();
    else this.unlock();
  }

  pause() {
    for (const list of this.players.values()) {
      for (const player of list) {
        try {
          player.pause();
        } catch {
          /* already paused */
        }
      }
    }
  }

  dispose() {
    this.disposed = true;
    this.pause();
    for (const list of this.players.values()) {
      for (const player of list) {
        try {
          player.remove();
        } catch {
          /* already released */
        }
      }
    }
    this.players.clear();
  }
}
