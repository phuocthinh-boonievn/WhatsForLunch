# WhatsForLunch

Expo clone of [Trưa nay ăn gì?](https://nagisanzenin.github.io/truanayangi/) — a single-screen CS:GO-style Vietnamese lunch case opener.

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

- 116 dishes (8 vegetarian) with rarity from price bands
- Warehouse UI (`#27323b`, square corners, gold selector, rarity colors)
- Budget presets 35 / 50 / 75 / 100 / 150kđ (default 50) plus custom 30–180
- Vegetarian switch conditions the same weighted pool (does not refit the mean)
- Weighted random: log-price kernel (`σ = 0.35`) + Lagrange tilt so `E[price] ≈ budget`
- **MỞ HÒM** plays a 7.5–9.5s horizontal reel with tick SFX; reduced-motion uses a 150ms path
- Gold (tier-4) reel tiles show **★ MÓN BÍ ẨN** until the winner modal reveals the dish
- Winner modal: **VẬT PHẨM MỚI**, price, **TÌM QUÁN** (Google Maps `{name} gần đây`), **TIẾP TỤC** / **MỞ LẠI**
- Inventory **TRONG HÒM CÓ GÌ?** sorted rarity → price → name (non-interactive)
- Global counter `GET`/`POST` `https://truanayangi-counter.nagisanzenin.workers.dev/spins` (fails soft)
- Sound toggle defaults on and is session-only — no localStorage, favorites, share, history, or auth

Food art and CS:GO crate SFX are loaded from the original site:

`https://nagisanzenin.github.io/truanayangi/`

## Tests

```bash
npm test
```

Checks catalog size, rarity bands, exact expected-price targeting, vegetarian conditioning, and invalid budgets.
