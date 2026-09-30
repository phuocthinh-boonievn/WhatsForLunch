# Upstream sync (early Sep 2026 → 30 Sep 2026)

The Expo clone was cut from the CS:GO case opener around 9 Sep 2026. Since then the original moved from `https://nagisanzenin.github.io/truanayangi/` to `https://truanayangi.com/`.

## Where the source actually is

- `https://github.com/nagisanzenin/truanayangi` now resolves to `https://github.com/truanayangi-com/truanayangi`. `AGENTS.md` in that repo says the history was transferred on 10 Sep 2026.
- Public commits stop on 10 Sep 2026. That snapshot is a local Vite app (cookie preferences, no backend). It is **not** the current website.
- The live site is a private Next.js app. This sync reads the production client bundle `https://truanayangi.com/_next/static/chunks/514-cad059d956a73453.js` as of 30 Sep 2026, plus the public repo for the 9–10 Sep delta.
- Open PR #2 on this repo only changed `ASSET_BASE` to `https://truanayangi.com`. That fix is included here. `main` was still pointing at github.io.

## Ported

| Change | What we did |
| --- | --- |
| Asset host | `ASSET_BASE` is `https://truanayangi.com`. Warehouse art uses `/optimized/warehouse-desktop-150a589e9e45.webp`. Sounds stay at `/sounds/*.mp3`. |
| Per-dish art | The 144 core dishes load `/optimized/art-food-{id}-vN-{hash}.webp`. Drinks, snacks, nhậu, and meal sheets stay on hashed sprite atlases (`food-hd`, `food-expanded`, `food-lunch`, `food-common`, `food-meals`, `food-chinese/korean/japanese/indian`, `drink-*`, `snack-*`, `nhau-*`). |
| Sprite math | Ported the live layout function: 4×3 vs 2×2, per-sheet row percentages, the image-93 position override, and bottom clips. |
| Catalog size | 116 dishes → **384**: 168 food (144 core + 24 meal-sheet dishes, images 600–623), 72 drinks, 96 snacks, 48 nhậu. 15 are marked vegetarian. |
| Prices | 31 shared dishes changed price. Examples: cơm tấm 45→70, phở bò 55→70, falafel 150→90, gnocchi 250→130. `Burger` was renamed to `Burger bò` (still image 28, 65k). |
| New dishes | Breakfast/night sheets (bánh mì trứng, xôi, …), regional dishes (mapo, kung pao, samgyetang, dosa, …), plus full drink, snack, and nhậu catalogs. |
| Categories | Each dish has a category id. Labels match the site (`Cơm & xôi`, `Cà phê`, `Món mặn`, …). Core dishes without a stored category use the site's image→category map. |
| Rarity | Bands are per kind. Food: ≤40 / ≤65 / ≤100 / ≤150 / else ★. Drink: ≤20 / ≤30 / ≤35 / ≤45. Snack: ≤20 / ≤30 / ≤45 / ≤60. Nhậu: ≤50 / ≤80 / ≤120 / ≤150. Food tier 4 now starts **above 150k** (sushi at 150k is tier 3, not ★). |
| Budgets | Slots `30 / 50 / 100 / 150 / unlimited` with kind-specific targets. Food: 30, 50, 80, 120, 180. Labels: `Hết tiền rồi · Nk` and `Mới nhận lương · Nk`. Custom entry remains, bounded by the current pool. The target is clamped into `[min price, max price]` before the selector runs, matching the site's `to()`. |
| Kinds | Chips: Món chính, Đồ uống, Ăn vặt, Món nhậu. Vegetarian applies only to món chính. |
| Meal time | Ăn sáng / Ăn trưa / Ăn tối / Ăn đêm, defaulted from the clock (`<4` night, `<10` breakfast, `<16` lunch, else dinner). Lunch hides images 600–623. Breakfast and night use the site's allow-lists. Dinner is lunch plus `additionalDinner` (612–623). |
| Selector | Same log-price kernel (`σ = 0.35`) and Lagrange tilt. The selector is fit on the kind+meal pool, then the draw is conditioned (vegetarian, recent-card avoidance). Filler cards skip zero-probability dishes. |
| Reduced motion | Upstream profile: 4.0–5.0s and 10–13 tiles, not a 150ms cut. |
| Counter | Poll every 10s, timeout 8s. `GET`/`POST` `https://truanayangi.com/api/spins` with `{ id, food, settings }`. On 30 Sep 2026 that origin returned Cloudflare 530, so a failed call falls back to `https://truanayangi-counter.nagisanzenin.workers.dev/spins` (`{ id }` on POST), which still returned `{ count }`. |
| Copy | Counter reads `Đã ghi nhận N hòm`. Winner label is `MÓN CỦA BẠN`. Budget label is `Ngân sách bữa ăn`. Prices use `70.000đ`. Note: `Tầm Nk · món quay ra có thể rẻ hoặc đắt hơn.` Inventory title: `Các món trong hòm`. |
| GrabFood | Winner modal links to `food.grab.com` search, same query shape as the site. |
| Footer | Links to the site's privacy page, terms, and `github.com/truanayangi-com/truanayangi`. |

## Not ported

| Change | Why |
| --- | --- |
| Guild theme as the default skin (`KÉT HỘI THỢ LÙN`, `KHAI MỞ KÉT`, tiers THƯỜNG / HIẾM / SỬ THI / HUYỀN THOẠI / CỔ VẬT) | The same bundle still ships the case-opener strings (`MỞ HÒM`, QUỐC DÂN … ★ ĐẶC BIỆT). Guild mode is a `guild` prop plus private CSS. This app keeps the warehouse CS:GO shell those surprises are written against. |
| Other themes (`supply`, `fate`, `pig`, `oracle`, `cats`) | Separate visual systems, not a data change. |
| Languages beyond Vietnamese (en, zh, ko, ja, hi) | Large string table. `nameEn` is kept on the meal-sheet dishes and is not shown. |
| Accounts, Google login, owner dashboard | Dropped from the public repo on 10 Sep 2026. Production auth lives in private services. |
| Custom dish list, cookie preferences, last-choice restore | The public snapshot stores these in cookies. This clone stays session-only, which is how it already behaved (no localStorage). |
| Local-only spin counter from the public repo | `AGENTS.md` there says never label a browser cookie as a global total. The live site still has `/api/spins`. We follow the live site. |
| Analytics queue, delivery backoff, three-suggestion carousel, 5% cat-pâté swap | Telemetry and presentation extras tied to accounts and themes. |
| Price-0 outcomes (`lucky-break-*`, `skip-meal`, `cat-pate`) | Theme easter eggs. Price 0 is rejected by the selector. The golden-knife skin added here is cosmetic and is **not** in the probability pool. |
| Dish search, taste tags, and the `/dishes` catalog page | The case inventory remains the grid sorted rarity → price → name, now with a category line on each card. |
| Full-bleed art for drinks, snacks, nhậu, images 600–623 | The art map in the bundle only covers the 144 core dishes. |

## Still the same on purpose

- Weighted draw: log-price Gaussian prior, equal total weight per distinct price, softmax, Lagrange tilt so `E[price]` matches the budget.
- Gold reel tiles (rarity 4) stay `★ MÓN BÍ ẨN` until the modal.
- Sound toggle defaults on and is session-only.
- Maps search still uses `{name} gần đây`. `MỞ LẠI` is still on the modal.
