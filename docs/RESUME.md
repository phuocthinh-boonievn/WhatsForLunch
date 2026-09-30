# Resume and portfolio notes

For GitHub user **phuocthinh-boonievn**. Edit the bracketed bits. Do not invent download counts, revenue, or store rankings. This app is a fan-made Expo clone, not an official product, and it is not claimed here to be live on the App Store or Google Play unless you have actually shipped it.

## One-line title

**Trưa nay ăn gì?** — cross-platform CS:GO-style lunch case opener (Expo, React Native, TypeScript)

## Bullets

Pick three to five. Keep the ones you can talk through.

- Built a cross-platform lunch picker with Expo SDK 57, React Native 0.86, Expo Router, and TypeScript that runs in Expo Go from `npm install && npx expo start` on iOS, Android, and web.
- Implemented a weighted meal draw: a log-price Gaussian prior (σ = 0.35), equal total weight per distinct price, softmax, and a Lagrange tilt so the expected price matches the chosen budget, including vegetarian conditioning that does not refit the mean.
- Engineered the case reel as a monotonic ease (7.5–9.5s, shorter under reduced motion) with windowed tiles, tick-synced audio, and gold-tier dishes hidden as ★ MÓN BÍ ẨN until the reveal.
- Synced the catalog to the live site after it left GitHub Pages: 384 dishes across meals, drinks, snacks, and nhậu, per-kind rarity bands, meal-time pools, and a counter client that fails soft when the API is down.
- Wrote the EAS pipeline (`eas.json`, store ids, permission trimming) and a solo publishing guide for TestFlight, Play internal testing, and `eas update`, without committing signing keys.

## Portfolio paragraph

Trưa nay ăn gì? is a fan-made mobile clone of a Vietnamese “what’s for lunch” case opener. The wheel does not pick uniformly: each budget is a target mean, and a log-price kernel plus a one-dimensional Lagrange multiplier (a softmax tilt) shifts probability toward cheaper or more expensive dishes until the expected price matches. A horizontal reel, adapted from CS:GO case timing, plays that result back with tick sounds, a mystery state for the rarest tier, and a reduced-motion path that shortens the spin instead of skipping it. The app is one Expo codebase for iOS, Android, and web. A later pass brought the dish list, prices, rarity bands, and meal categories in line with the public website and left store submission as a documented EAS flow rather than a claim of a live listing.

Replace the last sentence if you do ship it, and then you can add a real link and a real install count.

## Skills and keywords

Expo, Expo Router, EAS Build, EAS Submit, React Native, TypeScript, React Native Reanimated, expo-audio, expo-haptics, weighted random sampling, softmax, Lagrange multiplier / exponential tilting, probability calibration, sprite sheets, reduced motion, iOS, Android, TestFlight, Google Play internal testing.

## Interview talking points

- **Why the mean is the product.** A uniform draw over 384 dishes would ignore a 35k versus 150k budget. Walk through the prior (log price around 50k, spread 0.35), the per-price weight so extra variants do not inflate a price point, and the binary search on the tilt until `E[price] = target`. Mention that the vegetarian switch filters the draw and does not rebuild the distribution, so the listed conditional mean can drift, and the UI says so.
- **Why rarity is not the random source.** Rarity is a price band and differs by kind (a 150k lunch is not gold; a 50k drink is). The selector never draws “by rarity color.” Gold is a consequence of price and the budget.
- **Reel versus result.** The winner is chosen before the animation. The spin profile only changes distance, duration, and friction. Reduced motion is a shorter profile, not a different distribution. Tick sounds follow the tile crossing the marker, so a slow device still ticks once per tile.
- **Fail-soft counter.** The reveal does not wait on the network. `GET`/`POST` try the site’s `/api/spins` and fall back to the older workers counter. A 530 or a timeout leaves the case usable.
- **What you would not claim.** You did not operate the original website, you did not license Valve’s sounds by shipping this repo, and you should not quote downloads you do not have. If a reviewer asks about store release, point at `docs/PUBLISHING.md`: the pipeline is prepared, and public release is blocked on asset and trademark permission.
- **A bug you can tell cleanly.** Food gold used to start above 130k. The live site moved that cut to 150k, so sushi at 150k dropped a tier. The tests lock the bands so a catalog edit cannot silently recolor the wheel.

## Placeholders

- Store link: [App Store URL] · [Play Store URL]
- Installs or other traffic: [X downloads] · [X TestFlight testers]
- If you later get permission to use the original art: [permission note and date]
