# Studzee Mobile

Expo client for Studzee. Reads content, quizzes, quests and points from
`studzee-api`, authenticates through Clerk, and receives push notifications
through Expo. Android and iOS from one codebase, with a web target that is
built but not shipped.

Read [`.docs/studzee.design.mobile.expo.md`](.docs/studzee.design.mobile.expo.md)
before changing anything: it explains how navigation, fonts, safe areas,
sheets, downloads and notifications actually work in this app.

## PREREQUISITES

| Tool     | Version    | Notes                                                                           |
| -------- | ---------- | ------------------------------------------------------------------------------- |
| Node.js  | 22         | Matches the backend and CI                                                      |
| npm      | 10         | `package-lock.json` is the lockfile. Do not introduce a second package manager. |
| Expo SDK | 54         | Pinned by `expo` in `package.json`                                              |
| EAS CLI  | >= 16.28.0 | Required by `eas.json`. Only needed to build or submit.                         |

Android Studio or Xcode are needed only for local native builds
(`npm run android`, `npm run ios`). Cloud builds through EAS need neither.

## SETUP

```bash
cd MOBILE
npm install
cp .env.example .env.local     # then fill in the Clerk publishable key
npm start
```

`npm start` prints a QR code. The project depends on `expo-dev-client` and
ships native modules, so scan it with a **development build**, not Expo Go.
Build one with `eas build --profile development`.

## ENVIRONMENT

Expo loads `.env.local`. Only variables prefixed `EXPO_PUBLIC_` reach the app,
and they are embedded in the bundle in plain text, so nothing secret belongs
here.

| Variable                            | Required | Purpose                                                                              |
| ----------------------------------- | -------- | ------------------------------------------------------------------------------------ |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes      | Clerk auth. `app/_layout.tsx` throws at boot without it.                             |
| `EXPO_PUBLIC_BACKEND_API_URL`       | No       | Base URL of `studzee-api`. Falls back to the Render deployment in `utils/config.ts`. |

To point at a local backend, set the URL to your machine's LAN IP for a
physical device, or `http://10.0.2.2:4000` for an Android emulator.
`localhost` reaches the device itself, not your machine.

## RUNNING

| Command           | What it does                                           |
| ----------------- | ------------------------------------------------------ |
| `npm start`       | Metro bundler, for use with a development build        |
| `npm run android` | Local native Android build, then install and run       |
| `npm run ios`     | Local native iOS build, then install and run           |
| `npm run web`     | Web target                                             |
| `npm run lint`    | ESLint via `expo lint`                                 |
| `npm run format`  | Prettier write. `npm run format:check` to verify only. |

## PROJECT LAYOUT

```
app/            Expo Router routes. The directory tree is the URL structure.
  (auth)/       Onboarding, sign in, sign up, password reset
  (tabs)/       The four tab screens: home, resources, profile, settings
  screens/      Everything reached by pushing, outside the tab bar
components/     Grouped by feature: auth, content, profile, onboarding, global
constants/      colors.ts, the palette imported where a Tailwind class cannot reach
contexts/       NotificationContext
hooks/          useCustomFonts, useCustomAlert, useNotificationPermissions,
                usePdfDownloads
lib/            api.ts, download.ts, notifications.ts, storage.ts, inapp.ts
types/          Shared types, including the backend response shapes in api.ts
utils/          config.ts, logger.ts, jwt.dev.ts
assets/         fonts, icons, images, lottie
```

## ROUTING

Three route groups, guarded in three places. `app/_layout.tsx` runs the
redirect that sends signed in users to `(tabs)` and everyone else to
`(auth)/onboarding`. Standalone `screens/` routes are deliberately skipped by
that redirect so a deep link can land on one directly.

Typed routes are on (`app.json` -> `experiments.typedRoutes`), so a route
string that does not exist is a TypeScript error rather than a runtime blank
screen.

## FONTS

Three families load from `assets/fonts` in `hooks/useCustomFonts.ts`, and the
splash screen is held until they resolve or fail:

| Family name in code | File                     |
| ------------------- | ------------------------ |
| `GoogleSans`        | `GoogleSansFlex.ttf`     |
| `ProductSans`       | `ProductSansRegular.ttf` |
| `ProductSans-Bold`  | `ProductSansBold.ttf`    |

These are local files. Do not add `@expo-google-fonts` packages for them.

## ADDING AN ONBOARDING SLIDE

Slides come from the `onboardingData` array in `app/(auth)/onboarding.tsx`.
Append an entry:

```ts
{
  id: '4',
  title: 'Your title',
  description: 'One or two sentences.',
  gradientColors,
  imageSource: 'https://studzee-assets.s3.ap-south-1.amazonaws.com/assets/Your+Image.png',
}
```

`imageSource` is passed straight to `expo-image`, which accepts a bare URL
string, a `{ uri }` object, or the result of `require('@/assets/images/x.png')`
for a bundled image. The existing three slides all use remote S3 URLs.

## BUILDS AND RELEASES

Build profiles live in `eas.json`:

| Profile       | Distribution | Channel     | Notes                                       |
| ------------- | ------------ | ----------- | ------------------------------------------- |
| `development` | internal     | development | Development client, for daily work          |
| `preview`     | internal     | preview     | Installable build for testers               |
| `production`  | store        | production  | Android app bundle, auto increments version |

Version numbers come from EAS (`appVersionSource: "remote"`), not from
`app.json`.

Cut a release from the repository root, which bumps `package.json`, stages it,
and prints the git commands to run:

```bash
./release.sh mobile patch     # or minor, major
# or from inside MOBILE
npm run do-release            # do-release:minor, do-release:major
```

Pushing the tag is a deliberate step the owner takes after review.

Over-the-air updates go through `expo-updates` on the channel matching the
build profile. Note that OTA cannot deliver a change to a native module or to
`app.json` config plugins. Those need a new build.

## WHERE THINGS ARE DOCUMENTED

| File                                                                         | Holds                                                                                                                            |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| [`.docs/studzee.design.mobile.expo.md`](.docs/studzee.design.mobile.expo.md) | How this app is built: navigation, tabs, fonts, safe areas, styling, notifications, sheets, PDF download and storage, known gaps |
| [`../CLAUDE.md`](../CLAUDE.md)                                               | Repository orientation and house rules                                                                                           |
| [`../.docs/RULES.md`](../.docs/RULES.md)                                     | Process rules, the authority on how work is done here                                                                            |
| [`../BACKEND/API.md`](../BACKEND/API.md)                                     | Every endpoint this client calls                                                                                                 |
