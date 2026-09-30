# WhatsForLunch

Expo clone of [Trưa nay ăn gì?](https://truanayangi.com/) — a CS:GO-style Vietnamese lunch case opener. The original moved off GitHub Pages; dish data in this repo follows the live site as of 30 Sep 2026. See [docs/UPSTREAM.md](docs/UPSTREAM.md) for every change that was ported or skipped.

**Stack:** Expo SDK 57 · React Native 0.86 · Expo Router · TypeScript.

## Run

```bash
npm install
npx expo start
```

Then:

- press `w` for web
- scan the QR code with [Expo Go](https://expo.dev/go) on iOS or Android
- or `npx expo start --web` / `--android` / `--ios`

## What it does

- 384 items: 168 dishes (including breakfast and dinner sheets), 72 drinks, 96 snacks, 48 nhậu; 15 marked vegetarian
- Kind chips (món chính / đồ uống / ăn vặt / món nhậu) and, for food, meal time (sáng / trưa / tối / đêm) defaulted from the clock
- Warehouse UI (`#27323b`, square corners, gold selector, CS:GO rarity colors and names)
- Budget slots per kind (`Hết tiền rồi` through `Mới nhận lương`) plus a custom amount inside that pool's price range
- Vegetarian switch on món chính only; it conditions the same weighted pool and does not refit the mean
- Weighted random: log-price kernel (`σ = 0.35`) + Lagrange tilt so `E[price] ≈ budget`
- **MỞ HÒM** plays a 7.5–9.5s horizontal reel (4.0–5.0s and fewer tiles under reduced motion) with tick SFX
- Gold (tier-4) reel tiles show **★ MÓN BÍ ẨN** until the winner modal
- Winner modal: **MÓN CỦA BẠN**, price, **TÌM QUÁN**, **GrabFood**, **TIẾP TỤC** / **MỞ LẠI**
- Inventory **TRONG HÒM CÓ GÌ?** sorted rarity → price → name, with a category line
- Global counter: `GET`/`POST` `https://truanayangi.com/api/spins`, falling back to the workers.dev counter (fails soft)
- Sound toggle defaults on and is session-only — no localStorage, favorites, share, history, or auth

Food art and crate SFX load from `https://truanayangi.com`. Core dishes use per-image optimized art; the rest use sprite atlases.

Store submission is documented, not done. Read [docs/PUBLISHING.md](docs/PUBLISHING.md) before a public release — the food images, crate SFX, and CS:GO wording need permission or replacement. Portfolio wording is in [docs/RESUME.md](docs/RESUME.md).

## Surprises

Session-only, and they stay off the probability pool. Reduced motion skips shake, confetti, the rare-tile shine, and shake-to-open. The sound toggle also silences haptics.

1. **Gold burst and rare shine.** A ★ ĐẶC BIỆT reveal fires a short particle burst and a screen shake. Rarity ≥ TỐI MẬT tiles on the reel also get a light sweep.
2. **Haptics.** Reel ticks and the reveal pulse through `expo-haptics` when sound is on. Muted or reduced-motion sessions stay still.
3. **Dao bếp vàng.** Tap the title seven times within a few seconds, or long-press it, to unlock a golden-knife case skin for this session. The selector turns hot gold, the inventory gains a cosmetic card, and a gold win mentions the knife. The knife is not a dish in the weighted draw.
4. **StatTrak™.** A session counter of completed opens, plus a rare-or-better streak (rarity ≥ CỰC PHẨM) that breaks on a lower tier.
5. **Shake to open.** A firm shake on a phone starts **MỞ HÒM** (not on web, not while a spin is running, not with reduced motion).

## Tests

```bash
npm test
npx tsc --noEmit
```

`npm test` checks catalog size, per-kind rarity, meal windows, budget targets, exact expected-price targeting, sprite and art URLs, and the surprise rules (tap window, streak, shake threshold, haptic and gold gates).
