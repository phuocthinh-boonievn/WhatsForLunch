# Publishing to the App Store and Google Play

This is a solo-developer path for shipping **Trưa nay ăn gì?** with [EAS](https://docs.expo.dev/eas/) (Expo Application Services). The repo already has a real `eas.json` and the `app.json` fields a build needs. It does **not** contain Apple or Google credentials, and it should not.

`npm install && npx expo start` still runs the app in Expo Go. A store binary is a separate step (`eas build`) and does not replace that.

Confirm every fee, screenshot size, and form on the official page before you pay or submit. Stores change them.

## 0. Read this before you pay for a developer account

This app is a fan-made Expo clone. A public store listing can be rejected, or create legal risk, if you ship it as-is:

- **Valve / CS:GO.** The UI copies case-opening language (`MỞ HÒM`, rarity tiers, `StatTrak™` in the surprises) and plays crate sound effects. Those sounds are loaded from `truanayangi.com` and are attributed in the footer as Valve / [SourceSounds](https://github.com/sourcesounds/csgo). You need a license, or you must replace the SFX and drop trademarked names, before a public release. "Fan-made" in the footer is not permission.
- **Food art.** Dish images and the warehouse photo are loaded from `https://truanayangi.com`. They are third-party assets. Get written permission from the site owner, or replace every image with art you can license, before a public release.
- **Name and bundle id.** `com.truanayangi.app` and the title `Trưa nay ăn gì?` match someone else's product. Use them only if you are allowed to publish under that name. Otherwise pick your own title and an id you control, such as `com.<yourname>.whatsforlunch`.
- **Privacy policy.** Do not paste `https://truanayangi.com/privacy.html` as *this* app's policy. That page covers their website. Write a policy for this binary (what it sends, to whom).

Internal testing (TestFlight, Play internal track) is the right place to learn the pipeline while those items are still open. Do not send the app to public review until the checklist at the bottom is honest.

## 1. Expo account and EAS

1. Create a free account at [expo.dev/signup](https://expo.dev/signup).
2. Install the CLI and log in (your machine, not this repo):

   ```bash
   npm install -g eas-cli
   eas login
   ```

3. From the project root, link the app. This writes `extra.eas.projectId` into `app.json` and creates the project on Expo's servers:

   ```bash
   eas init
   ```

   Accept the slug `whats-for-lunch` or change `expo.slug` first if you want a different URL. Set `expo.owner` to your Expo username if the project should live under your account rather than a personal default.

`eas init` does not need Apple or Google credentials.

## 2. `app.json` fields

Current values are enough for `eas build` to *start*. Replace the ones marked owner-specific.

| Field | Now | What to do |
| --- | --- | --- |
| `expo.name` | `Trưa nay ăn gì?` | Store name. Change it if you do not have rights to that title. |
| `expo.slug` | `whats-for-lunch` | Expo project slug. Set before `eas init` if you want a different one. |
| `expo.version` | `1.0.0` | User-facing version (`CFBundleShortVersionString` / `versionName`). Bump for each store release. |
| `expo.icon` | `./assets/icon.png` | 1024×1024 PNG, no transparency, no trademark you do not own. |
| `expo.splash` | `./assets/splash-icon.png` on `#27323b` | Replace with your own splash. |
| `ios.bundleIdentifier` | `com.truanayangi.app` | Must match the App ID you register. Change if needed **before the first store build**. |
| `ios.buildNumber` | `1` | iOS build number. Production profile uses EAS remote autoincrement (see `eas.json`). |
| `android.package` | `com.truanayangi.app` | Play application id. Immutable after the first upload. |
| `android.versionCode` | `1` | Integer. Production autoincrement overrides this remotely after the first build. |
| `ios.supportsTablet` | `true` | If you leave this on, Apple expects iPad screenshots. Set `false` if you only want iPhone. |
| `ios.infoPlist.ITSAppUsesNonExemptEncryption` | `false` | Answers the export-compliance prompt. This app only uses HTTPS. If you add custom crypto, change this. |
| `android.blockedPermissions` | `RECORD_AUDIO` | Playback does not need a microphone. Kept blocked so a library cannot merge it back in. |
| `plugins` → `expo-audio` | mic off, no background audio | `microphonePermission: false`, `recordAudioAndroid: false`, background playback and recording off. |
| `scheme` | `truanayangi` | Deep link scheme. Change it if you rename the app. |

Icons already in `assets/` (`icon.png`, Android adaptive icons, `splash-icon.png`, `favicon.png`) are build inputs. Treat them as placeholders until you swap in licensed art.

You do **not** need location, contacts, camera, photo library, or microphone usage strings. Do not add them.

After `eas init`, `app.json` should also contain:

```json
"extra": { "eas": { "projectId": "<uuid from eas init>" } }
```

## 3. `eas.json` profiles

The file in the repo:

- `development` — dev client, internal distribution, iOS simulator build. Use this if you outgrow Expo Go.
- `preview` — internal distribution. Android builds an **APK** you can sideload. iOS builds a device binary for internal testers.
- `production` — Android **App Bundle** (what Play requires), `autoIncrement: true`, remote version source.
- `submit.production` — Play track `internal` so the first submit is not a public release. iOS submit uses the defaults (TestFlight / App Store Connect).

No keystore, no Apple certificate, and no service-account JSON are stored here. EAS creates and holds credentials on their servers when you build.

`cli.appVersionSource` is `remote`: production `versionCode` / `buildNumber` are stored by EAS, not only in git.

## 4. Apple Developer Program

1. Enroll at [developer.apple.com/programs](https://developer.apple.com/programs/) with the Apple ID you will ship under.
2. Individual enrollment is the usual solo path. You will need a paid membership. The published fee has long been **US$99 per year**. Confirm the amount on the enrollment page; it is charged by Apple, not Expo.
3. Enrollment can ask for a legal name and, in some regions, extra identity checks. Wait until the account shows as active.
4. In [App Store Connect](https://appstoreconnect.apple.com/), create an app:
   - Bundle ID must equal `ios.bundleIdentifier`.
   - SKU is any private string, for example `whats-for-lunch`.
   - Primary language: Vietnamese if the UI stays Vietnamese.
5. You do not create the distribution certificate by hand if EAS manages it. The first `eas build -p ios` will offer to generate a distribution certificate and a provisioning profile. Say yes.

Paid Applications agreement, tax, and banking must be complete in App Store Connect before you can sell the app. This app is intended to be free. You still need the agreement active for TestFlight in some cases. If you never charge, you can skip banking until Apple asks.

## 5. Google Play Console

1. Register at [play.google.com/console](https://play.google.com/console).
2. The published one-time registration fee has long been **US$25**. Confirm it on the signup page.
3. Identity verification (government id, or organization documents) can take a few days. You cannot upload a release until it finishes.
4. Create an app. The application id must equal `android.package`. It cannot be changed later.
5. The first `eas build -p android` will offer to generate an upload keystore and store it on EAS. Say yes. Download the keystore backup when EAS shows it and keep it offline. Losing it without Play App Signing recovery is painful; new apps use Play App Signing, and EAS is the upload key.

## 6. Build

From a clean tree, after `eas init` and `eas login`:

```bash
npm install
npx tsc --noEmit
npm test

# Internal Android APK (no Play upload yet)
eas build -p android --profile preview

# Internal iOS device build (needs the Apple account linked)
eas build -p ios --profile preview

# Store binaries
eas build -p android --profile production
eas build -p ios --profile production
```

What happens without credentials on the machine:

- EAS asks which Apple team / Google account to use, then creates credentials remotely.
- You can inspect them later with `eas credentials`.
- Nothing secret should be committed. `.gitignore` already ignores `*.jks`, `*.p8`, `*.p12`, `*.key`, `*.mobileprovision`, and `.env*.local`.

A build failure about `extra.eas.projectId` means `eas init` has not been run. A failure about the bundle id means the Apple App ID or Play app does not exist yet, or the id is already taken by another account.

## 7. TestFlight and Play internal testing

**iOS**

1. `eas build -p ios --profile production` (or `preview` if you only want ad-hoc / internal).
2. `eas submit -p ios --profile production` and choose the finished build. Or pass `--latest`.
3. In App Store Connect → TestFlight, wait for processing. Export compliance should already be answered by `ITSAppUsesNonExemptEncryption`.
4. Internal testers (App Store Connect users on your team) can install immediately. External testers need a short Beta App Review.
5. Install through the TestFlight app. Run a spin, toggle sound, try a gold reveal, and confirm the counter failure does not block the reel.

**Android**

1. `eas build -p android --profile production` produces an `.aab`.
2. Create a Play service account with release permissions, download its JSON key, and either:
   - `eas submit -p android --profile production` and give EAS the key when asked, or
   - upload the `.aab` by hand to the **Internal testing** track.
3. The `submit.production.android.track` value is `internal`, so the CLI targets that track rather than production.
4. Add tester emails, roll out the release, and open the opt-in link on a device.

The preview APK (`--profile preview`) is useful before Play identity verification finishes. It is not what you upload to production.

## 8. Store listing assets

Prepare these before you fill the store pages. Use your own screenshots of this app, not captures of truanayangi.com.

**Apple (confirm the slot list in App Store Connect after upload)**

- iPhone 6.9" portrait: 1320×2868, or 6.7" 1290×2796. Usually 3–10 screenshots.
- iPhone 6.5" portrait: 1284×2778 or 1242×2688, if Connect still asks.
- iPad 13" portrait: 2064×2752 or 2048×2732, because `supportsTablet` is true. Turn tablet support off if you will not ship iPad screenshots.
- Description, subtitle, keywords, support URL, marketing URL optional.
- Privacy policy URL: a page **you** host.
- Age rating questionnaire, and export compliance (already false in `app.json`).

**Google Play**

- Phone screenshots: at least 2, PNG or JPEG, each side between 320 and 3840 px, aspect ratio between 1:2 and 2:1. 9:16 phone shots are the usual choice.
- Feature graphic: 1024×500 PNG or JPEG.
- Hi-res icon: 512×512 PNG, 32-bit, no rounded corners (Play masks them).
- Short description (80 characters) and full description (up to 4000).
- Privacy policy URL, same rule as Apple.
- App category: Food & Drink.

**Copy you can start from (edit it; do not claim you are the official site)**

> Fan-made lunch picker. Set a budget, open a case, and get one dish, drink, snack, or drinking snack. Prices are typical portions in thousands of đồng, not a restaurant quote. Not affiliated with the website it was inspired by, or with Valve.

## 9. Privacy, data safety, and content rating

What this binary actually does:

- No account, no analytics SDK, no ads.
- Loads images and short sounds from `https://truanayangi.com`.
- After a spin, may `POST` a random id plus dish name, price, image id, kind, and budget to `https://truanayangi.com/api/spins`, and fall back to `https://truanayangi-counter.nagisanzenin.workers.dev/spins` with the id only. The UI still works if both fail.
- Opens Google Maps or GrabFood in the browser when the user taps those buttons.
- Sound, StatTrak, and the golden-knife skin stay in memory for the session. Nothing is written to disk on purpose.
- Haptics and the accelerometer (shake to open) stay on device.

**App Store privacy "nutrition label"**

- Data used to track you: No.
- Data linked to you: No, if you never add accounts.
- Data not linked to you: declare the spin id and dish choice as **Product Interaction** or **Other Diagnostic Data** only if you keep the counter. If you remove the counter before release, say you collect nothing.
- Purposes: App Functionality.

**Play Data safety**

- App does not sell data.
- If the counter stays: data is sent off device (spin id, dish, budget) to a third-party URL, not used for ads, not shared with advertisers. Encryption in transit: yes (HTTPS). Users cannot request deletion of a random spin id; say that in the policy.
- If you delete the counter calls before release, you can answer that no user data is collected. Remote images are not "user data".

**Content rating**

- No violence, no sexual content, no gambling for money, no user-generated content, no unrestricted webview.
- The case-opening theme is fictional and pays out a meal suggestion, not money or items of value. Say that plainly if a reviewer asks about loot boxes. Do not add real-money cases.

**Privacy policy must mention**

- Who you are (a solo developer, not the truanayangi.com operators, unless that is actually you).
- The counter host, what is sent, and that it is optional in the sense that the app works when the request fails.
- Third-party images and sounds loaded from truanayangi.com.
- Links to Google Maps and GrabFood.
- Contact email.

## 10. Review pitfalls

- Impersonation. Do not use Valve's, Grab's, or the original site's logos. Do not say "official".
- Trademark text in the binary (`StatTrak™`, CS:GO-style rarity names) and the crate SFX. Replace or license them before public review.
- Hotlinked food photos. A reviewer, or the copyright holder, can treat remote images as unlicensed. Download replacements you own, point `ASSET_BASE` at your host, or vendor them in the binary.
- `RECORD_AUDIO` is blocked and the audio plugin is set not to ask for the microphone. If a later dependency adds it, remove it. A microphone prompt with no recording feature is a common rejection.
- Background audio is off. Do not re-enable `UIBackgroundModes: audio` unless you truly play in the background and declare it.
- Login walls. There are none. Do not add a fake account to satisfy a review note.
- Broken links. Maps and Grab must be user-initiated. They are.
- Placeholder contact and privacy URLs. Apple rejects `example.com`.
- iPad layout. If `supportsTablet` stays true, check a wide window. The reel and inventory already reflow; still look at them on an iPad simulator before you promise tablet support.

## 11. OTA updates with `eas update`

JavaScript and asset changes can ship without a store review. Native changes (new modules, `app.json` permissions, SDK bumps) need a new `eas build`.

This repo does not depend on `expo-updates` yet, so Expo Go and the current binary do not check for updates. When you want OTA:

```bash
npx expo install expo-updates
```

Add to `app.json` (use the project id from `eas init`):

```json
"runtimeVersion": { "policy": "appVersion" },
"updates": { "url": "https://u.expo.dev/<projectId>" }
```

Publish a channel that matches the build:

```bash
eas update --channel production --message "Copy fix"
```

`runtimeVersion` policy `appVersion` means an OTA only installs on binaries with the same `expo.version`. Bump `expo.version` and make a new store build when native code changes. Users on the old binary keep the old JS until they update from the store.

`eas update` publishes whatever is committed and installed. Run `npm test` and `npx tsc --noEmit` first. It will not fix a missing privacy policy or an unlicensed image.

## 12. Pre-submission checklist

- [ ] `eas init` done; `extra.eas.projectId` is yours.
- [ ] App name, slug, and bundle / package ids are ones you are allowed to ship.
- [ ] `expo.version` bumped; you know whether EAS remote version codes will autoincrement.
- [ ] Icon and splash are yours, 1024×1024 icon, no trademark.
- [ ] Food images and crate SFX are licensed or replaced. `ASSET_BASE` does not hotlink assets you cannot use.
- [ ] CS:GO / StatTrak / Valve names removed or licensed.
- [ ] `RECORD_AUDIO` still blocked; no microphone string in the binary (`eas build` then inspect the manifest / Info.plist if you are unsure).
- [ ] `npm test` and `npx tsc --noEmit` pass.
- [ ] Production `eas build` for both platforms succeeded.
- [ ] TestFlight internal build installed and a full spin works with sound on, sound off, and airplane mode (counter fails soft).
- [ ] Play internal track installed the same way.
- [ ] Privacy policy URL is live and describes this app.
- [ ] App privacy (Apple) and Data safety (Play) match the counter behavior you actually shipped.
- [ ] Content rating questionnaire submitted.
- [ ] Screenshots are of this app, at the sizes Connect / Play ask for, phone and iPad if tablet support stays on.
- [ ] Description says fan-made and does not imply an official partnership.
- [ ] Support email works.
- [ ] You have a backup of the Android upload keystore and the Apple credentials EAS holds (`eas credentials`).
