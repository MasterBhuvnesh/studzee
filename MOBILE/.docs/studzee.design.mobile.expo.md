# STUDZEE MOBILE DESIGN, EXPO

Reference for how the mobile client is put together: navigation, the
notification pipeline, the custom alert and bottom sheet, how a downloaded
PDF is tracked and viewed, the skeleton loading pattern, and the visual
language, its components, colors, type and buttons. Written against what the
code actually does, not what it was meant to do.

## STACK

Expo SDK 54, Expo Router (file-based routing), React 19, React Native 0.81,
NativeWind (Tailwind for React Native), Clerk for auth, `@gorhom/bottom-sheet`
for the bottom sheet, `expo-notifications` plus a custom backend endpoint for
push. No client-side state library beyond React state and context, no data
fetching library beyond Axios.

## APP SHELL AND NAVIGATION

Route groups under `app/`:

```
app/
  (auth)/     onboarding, sign-in, sign-up, forgot-password, reset-password
  (tabs)/     index (home), resources, profile, settings
  screens/    [id], content, pdfs, quiz, edit-profile, edit-bio,
              send-feedback, get-support, privacy-policy, terms-of-use
```

`app/_layout.tsx` is the root. Provider order matters here:

```
GestureHandlerRootView
  ClerkProvider (tokenCache, publishableKey)
    SafeAreaProvider
      NotificationProvider
        BottomSheetModalProvider
          RootLayoutNav (auth-gated router)
```

`RootLayoutNav` watches `useAuth()` and `useSegments()` and redirects: signed
in and not in `(tabs)` goes to `/(tabs)`, signed out and not in `(auth)` goes
to `/(auth)/onboarding`. Routes under `screens/` are exempt from this
redirect, they are reachable regardless of auth state check timing. A
`navigationAttempted` ref plus a 100ms/1000ms setTimeout pair debounce the
redirect so it fires once per state change instead of looping on every
re-render.

`NotificationProvider` wraps the router, not the other way round, so push
registration starts as soon as Clerk resolves a user, before the redirect
even happens.

## NOTIFICATIONS

Three files:

- **`contexts/NotificationContext.tsx`**, the provider. Owns `expoPushToken`,
  `error`, `isLoading`, and exposes `registerToken()`.
- **`hooks/useNotificationPermissions.ts`**, the settings-screen hook. Owns
  the permission state machine (`granted` / `denied` / `undetermined`) and
  calls `registerToken()` from the context after a permission grant.
- **`lib/notifications.ts`**, the actual work. Requests OS permission, reads
  the Expo push token, sets up the Android notification channel, and POSTs
  the token to the backend.

Flow on a fresh login: `NotificationProvider` sees `user` become non-null,
calls `registerForPushNotificationsAsync(email, getToken)`, which requests OS
permission if not already granted, calls `Notifications.getExpoPushTokenAsync`
with the EAS project ID, then POSTs to
`{EXPO_PUBLIC_BACKEND_API_URL}/notifications/register` with the Clerk bearer
token. The backend response is a device count summary, not the stored row,
`registerTokenWithBackend` in `lib/notifications.ts` types this as
`BackendTokenResponse` from `types/notification.ts`.

Manual re-registration (the settings toggle, or "permission already granted,
make sure the token is still registered") goes through the same
`registerToken()` on the context rather than re-implementing the flow, so
there is exactly one path that talks to the backend.

**Gotcha worth knowing:** Clerk's `getToken` from `useAuth()` is not
referentially stable across renders. `registerToken` used to depend on
`[user, getToken]`, which meant every render the registration flow itself
caused, by calling `setIsLoading`/`setExpoPushToken`, produced a new
`registerToken` identity and refired the auto-register effect. In testing
this sent dozens of duplicate `POST /notifications/register` calls in one
session before the backend responded 429. Fixed by keying the effect on the
signed-in email (a stable string) and reading `getToken` through a ref
instead of the dependency array.

## CUSTOM ALERT

`components/global/CustomAlert.tsx` replaces React Native's `Alert.alert`
with an in-app modal, so the styling matches the rest of the app instead of
the OS default. It is a dumb, config-driven component:

```
{ visible, title, message, buttons: [{ text, style, onPress }], onDismiss }
```

`style` is `'default' | 'cancel' | 'destructive'`, mapped to blue, zinc, or
red text respectively.

There is no shared alert hook. Every screen that needs one (`pdfs.tsx`,
`resources.tsx`, `[id].tsx`, and others) keeps its own local
`alertConfig` state plus `showAlert` / `hideAlert` helpers and renders its own
`<CustomAlert>` instance. The logic is identical across screens, copy-pasted
rather than extracted.

## BOTTOM SHEET

`components/global/CustomBottomSheetModal.tsx` wraps
`@gorhom/bottom-sheet`'s `BottomSheetModal` with the app's styling: a single
30% snap point, pan-down-to-close, a backdrop that appears/disappears with
the sheet. It takes a ref (`forwardRef`) so the parent screen controls
`present()` / `dismiss()` imperatively rather than through visible state.

`BottomSheetModalProvider` has to sit above any screen that renders one of
these, which is why it wraps the router in the root layout rather than living
per-screen.

Used for the downloaded-PDF action sheet: `pdfs.tsx` and `resources.tsx` both
hold a `bottomSheetRef`, call `.present()` when a downloaded PDF row is
tapped, and render `DownloadedPdfInfo` (view / share / remove) inside it.

## TRACKING WHICH PDF IS ON DEVICE

**`lib/storage.ts`** is the source of truth. It keeps a single JSON array of
`DownloadedPdfMetadata` under one `expo-secure-store` key,
`downloaded_pdfs`:

```ts
interface DownloadedPdfMetadata {
  documentId: string;
  title: string;
  pdfName: string;
  localUri: string;
  size: number;
  downloadedAt: string; // ISO timestamp
  originalUrl: string;
}
```

`saveDownloadedPdf`, `getDownloadedPdfs`, `removeDownloadedPdf`,
`isPdfDownloaded`, `getDownloadedPdf` all read and rewrite that one array.
There is no per-file lookup key, just a linear scan by `documentId` on
whatever list `getDownloadedPdfs()` returns, which is fine at the scale a
single user's downloads reach.

The list screens (`pdfs.tsx`, `resources.tsx`) do not check storage per row.
On every `fetchData()` they call `getDownloadedPdfs()` once and derive a
`downloadedIds: string[]` array (`downloaded.map(pdf => pdf.documentId)`).
Each "available" row then does `downloadedIds.includes(pdf.documentId)` to
decide whether to render a checkmark, a spinner (mid-download, tracked
separately in `downloadingIds`), or the plain download icon. This is a
snapshot, not reactive. It goes stale until the next `fetchData()` or
`refreshDownloadedPdfs()` call, which is why every download/remove action
calls `refreshDownloadedPdfs()` afterward rather than relying on the storage
layer to push an update.

**`screens/[id].tsx`** (a content/lesson detail screen) attaches PDFs too,
with its own view and download buttons, but it never calls
`isPdfDownloaded()` or reads `downloadedIds`. Its PDF rows always show
"view in browser" and "download", never the downloaded checkmark that
`pdfs.tsx` and `resources.tsx` show. That is a real gap, not a stylistic
choice, worth knowing before assuming download state is consistent
everywhere PDFs appear.

## VIEWING A PDF: TWO DIFFERENT CODE PATHS

**Not on device** (the "available" list, and always in `[id].tsx`): opens
the remote URL directly with
`WebBrowser.openBrowserAsync(pdf.pdfUrl)`. Nothing is written to disk, this
is just an in-app browser tab pointed at the PDF's public URL.

**On device** (a row in the "downloaded" tab): tapping it opens the bottom
sheet, and "View PDF" there calls `openPdf(localUri)` from `lib/download.ts`,
which is platform-specific:

- **Android**: `expo-file-system/legacy`'s `getContentUriAsync` converts the
  `file://` URI to a `content://` one (required because Android blocks
  `file://` intents to other apps on modern targets), then
  `expo-intent-launcher` fires `android.intent.action.VIEW` with
  `type: 'application/pdf'` and the read-permission flag. This hands off to
  whatever PDF viewer is installed.
- **iOS and web**: there is no direct "open with" primitive, so it reuses
  `expo-sharing`'s `Sharing.shareAsync(localUri, { mimeType: 'application/pdf' })`.
  The iOS share sheet includes "Open in..." style options, so sharing doubles
  as viewing there. This is a deliberate platform workaround, not a copy-paste
  mistake, the two branches exist because iOS and Android have no common API
  for "just open this local file."

## SHARE

`sharePdf(localUri)` in `lib/download.ts` only operates on files already on
disk. It checks `file.exists` (via the new `expo-file-system` `File` API)
and `Sharing.isAvailableAsync()` before calling
`Sharing.shareAsync(localUri, { mimeType: 'application/pdf', dialogTitle: 'Share PDF' })`.
There is no share path for a PDF that has not been downloaded, the UI never
offers a share button on the "available" tab, only on downloaded rows.

## SKELETON LOADING

No shimmer or animation library is used. The `loading` skeleton in
`resources.tsx`, `content.tsx`, `[id].tsx` and `(tabs)/index.tsx` is a set of
plain `<View>` elements shaped like the real card, styled with a flat
`bg-zinc-200` Tailwind class, swapped out for the real content once `loading`
flips to `false`. There is no pulse/opacity animation on them, they are
static gray blocks, structurally matching the layout so the swap does not
cause a layout jump.

## DOWNLOAD FLOW, START TO FINISH

`lib/download.ts`, using the new `expo-file-system` `File`/`Paths` API
(the legacy module is only imported for the Android content-URI helper):

1. `downloadPdf(documentId, title, pdfName, pdfUrl, size)` builds a filename
   from a sanitized title plus a timestamp, so re-downloading the same
   document never collides with an existing file.
2. `File.downloadFileAsync(pdfUrl, destinationFile, { idempotent: true })`
   downloads it into `Paths.document`. There is no progress callback: the new
   File API does not expose one the way the legacy API did.
3. Actual file size is read back from disk (`downloadedFile.info().size`)
   rather than trusting the `size` the caller passed in, since that number
   comes from the content API and can be stale or approximate.
4. Metadata is saved via `saveDownloadedPdf`, see the storage section above.

`deletePdf(documentId)` is the reverse: look up the metadata, delete the
`File` if it exists, then remove the metadata entry. If the metadata exists
but the file does not (deleted outside the app, or a failed prior delete),
it still removes the metadata rather than erroring, so storage does not get
stuck pointing at a missing file.

## PACKAGES, WHAT THEY ARE DOING HERE

| Package                                                                                                      | Used for                                                                                                     |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `expo-router`                                                                                                | File-based navigation, the `(auth)` / `(tabs)` / `screens` groups                                            |
| `@clerk/clerk-expo`, `@clerk/types`                                                                          | Auth, session, `getToken()` for backend bearer auth                                                          |
| `expo-secure-store`                                                                                          | Downloaded-PDF metadata (`lib/storage.ts`), token cache for Clerk                                            |
| `expo-notifications`                                                                                         | Permission request, Android notification channel, Expo push token                                            |
| `expo-device`                                                                                                | `Device.isDevice`, push tokens are skipped on simulators/emulators                                           |
| `expo-constants`                                                                                             | Reads the EAS project ID needed by `getExpoPushTokenAsync`                                                   |
| `expo-file-system`                                                                                           | Downloading PDFs to disk, checking existence, deleting (new `File`/`Paths` API)                              |
| `expo-file-system/legacy`                                                                                    | Only for `getContentUriAsync`, the Android `file://` to `content://` conversion the new API does not provide |
| `expo-intent-launcher`                                                                                       | Opens a downloaded PDF with the OS's PDF viewer on Android                                                   |
| `expo-sharing`                                                                                               | The share sheet, and the iOS/web substitute for "open this local file"                                       |
| `expo-web-browser`                                                                                           | Opens a PDF that is not on device, straight from its remote URL                                              |
| `@gorhom/bottom-sheet`                                                                                       | The downloaded-PDF action sheet, `CustomBottomSheetModal`                                                    |
| `react-native-gesture-handler`, `react-native-reanimated`, `react-native-worklets`                           | Runtime dependencies of `@gorhom/bottom-sheet` and Expo Router's animations                                  |
| `nativewind`, `tailwindcss`                                                                                  | All styling, `className="..."` throughout                                                                    |
| `lucide-react-native`                                                                                        | Icon set, wrapped by `components/global/AppIcon`                                                             |
| `expo-image`                                                                                                 | Image rendering, used for the PDF file icon and remote images                                                |
| `expo-linear-gradient`                                                                                       | Background gradients on card screens                                                                         |
| `axios`                                                                                                      | `lib/api.ts` and `registerTokenWithBackend`, the only HTTP client used                                       |
| `expo-clipboard`, `expo-image-picker`, `expo-image-manipulator`, `expo-document-picker`, `expo-auth-session` | Profile editing (avatar pick/crop) and auth session handling, not covered above                              |

## VISUAL LANGUAGE

Neutral and quiet by default, with one warm accent (amber, for streaks and
gems) and semantic colors (red, green, blue) used sparingly for state rather
than decoration. Nothing here is a design system package; it is NativeWind
utility classes repeated by convention across screens, so the patterns below
are read off the code, not off a spec someone wrote first.

### COLOR

`constants/colors.ts` exports the full Tailwind palette (zinc, slate, gray,
red, orange, amber, yellow, green, blue, and more), each as a 50 to 950 scale.
Almost everything on screen draws from **zinc**: zinc-50/100 for backgrounds,
zinc-200 for borders and dividers, zinc-400/500 for secondary text and
placeholders, zinc-700/800/900 for primary text and the primary button fill.
There is no separate "brand color". Zinc-800 (`#27272a`) is the closest thing
to one: it is the fill on every primary call to action across the app.

The other palettes are used narrowly and mean something specific when they
appear:

| Color | Where | Meaning |
| ----- | ----- | ------- |
| `red[500]` / `red[600]` | error banners, destructive alert buttons, unread dot | failure, destructive action |
| `green[500]` / `green[600]` | success toasts, correct quiz answer state, streak fire | success, correct, active streak |
| `blue[500]` / `blue[600]` | default alert button text, links, info accents | neutral affirmative action, informational |
| `amber[400]` / `amber[500]` | gems, streak counters, progress fill | the app's one warm accent, reserved for currency and momentum |
| `orange[500]` | secondary warning-adjacent accents | soft warning, distinct from red's hard error |
| `yellow[500]` | badge or highlight accents | attention without alarm |

A component never hardcodes a hex value inline beyond `colors.ts`; every
color reference in a component is `colors.<palette>[<step>]`.

### TYPE

Three font families, declared in `tailwind.config.js` and loaded in
`hooks/useCustomFonts.ts`:

| Class | Face | Used for |
| ----- | ---- | -------- |
| `font-product` | ProductSans (regular) | headings, screen titles, buttons, anything that reads as UI chrome |
| `font-product-bold` | ProductSans-Bold | emphasis inside product-styled text (bold spans in the support chat, for example) |
| `font-sans` | GoogleSans | body copy, descriptions, list items, anything that reads as content |

The rule of thumb the codebase follows without ever stating it: `font-product`
names things (a screen's `Header`, a button's label), `font-sans` explains
things (a paragraph, a card's description line). A screen title is
`font-product text-4xl text-zinc-900` (see `Header`, below); the paragraph
underneath it is almost always `font-sans text-sm` or `text-base` in
`text-zinc-500` or `text-zinc-700`.

GoogleSans ships no italic face. Where a component needs italic (the support
chat's rendering of `*emphasis*`) it uses React Native's synthesised oblique
via `className="italic"` rather than a missing font file.

### SCREEN ANATOMY

Every full screen in `app/screens/*.tsx` and the tab roots follow the same
shell, in this order, outermost first:

```
<LinearGradient colors={[...zinc shades...]} className="flex-1">
  <SafeAreaView className="flex-1">
    <Header title="..." />        {/* or a custom header row */}
    <ScrollView ...>              {/* the screen's content */}
    ...
  </SafeAreaView>
</LinearGradient>
```

The gradient is always outside the safe area, never the other way round: the
gradient is decoration and should run edge to edge including under the status
bar, while the safe area only needs to protect the content inside it. A
screen with a `KeyboardAvoidingView` (see `support-chat.tsx`) puts that
between the gradient and the safe area for the same reason: the safe area's
bottom inset must not double up with the keyboard's height.

Gradients are short, muted zinc ramps (`zinc[50]` to `zinc[200]`, sometimes
running through pure white first), never a saturated color. The effect is a
barely-there vignette, not a colored background.

### HEADER

`components/global/Header.tsx` is the whole of it: a `View` with
`px-6 pt-6` and a `Text` at `font-product text-4xl text-zinc-900`. No back
button, no actions slot. Screens that need a leading icon, a bell (see
`NotificationBell`), or a close action build their own header row inline
rather than extending `Header`, which is why `Header` itself stays a
single-purpose component rather than growing props for every screen's needs.

### BUTTONS

There are three recurring button shapes, distinguished by fill and radius
rather than by a named `<Button>` component; **the app has no shared button
component**, every screen writes its own `TouchableOpacity` or `Pressable`
with one of these class strings.

**Primary (filled, dark).** The main call to action on a screen. Solid
`zinc-800` fill, white text, `rounded-lg` or `rounded-xl`, a visible pressed
state, and a shadow when it needs to read as elevated above a light
background:

```
className="w-full rounded-xl bg-zinc-800 px-6 py-4 shadow-lg active:bg-zinc-700 disabled:opacity-50"
```

Sign in, sign up, and the support chat's send button (recolored to
`zinc-200`/`zinc-400` while disabled or empty) are all this shape.

**Secondary (outlined, light).** A lower-emphasis action beside or below a
primary one. White fill, a `zinc-200` border, `zinc-700`-ish text, no shadow:

```
className="flex-1 rounded-xl border border-zinc-200 bg-white px-6 py-3 active:bg-zinc-50"
```

**Icon button (circular, ghost).** A single icon with no visible fill until
pressed. Used for close buttons, the notification bell, and inline toggles:

```
className="rounded-full bg-zinc-100 p-2 active:bg-zinc-200"
```

All three use `active:` NativeWind states rather than a JS-driven pressed
style, and `disabled:opacity-50` rather than a separate disabled color, so a
disabled control still reads as the same button, just dimmed.

`AppIcon` (`components/global/AppIcon.tsx`) is the one shared primitive
underneath every icon on screen: a thin wrapper around a `lucide-react-native`
icon component that fixes the prop names (`size`, `color`, `strokeWidth`,
`fill`) to one call shape and defaults to `colors.zinc[500]` at
`strokeWidth={2}`. Nothing renders a lucide icon directly; everything goes
through `AppIcon`, including cases that need a lighter `strokeWidth={1.5}`
(most tab bar and header icons) for a less bold look at small sizes.

### CARDS

The default content card is white on a light background, a `zinc-200` border
(not a shadow-only card), rounded corners, and internal padding proportional
to how much it holds:

```
className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
```

`rounded-2xl` is for a card that is a whole tappable unit (a list row, a
grid tile); `rounded-xl` is for a smaller inline container (an input field, a
compact info box). `shadow-sm` is the default; `shadow-lg` is reserved for
something that should visually float above everything else on the screen (a
floating action pill, a modal's content box, an empty-state illustration
card).

### PILLS, CHIPS AND BADGES

Small rounded-full elements carry status, category or count information
inline with text, always `rounded-full` and always sized to their content
rather than to a fixed width:

- **Tag chip** (`components/content/TagChips.tsx`): `rounded-full bg-zinc-100
  px-2 py-0.5`, 10px text at `zinc-500`. Capped at three per card so a
  summary card never wraps to a third line.
- **Status pill**: `rounded-full border border-amber-200 bg-amber-50 px-2.5
  py-1` for a warm/active state, or the same shape in `zinc-200`/`zinc-50` for
  a neutral one.
- **Unread dot**: a bare `h-2.5 w-2.5 rounded-full bg-red-500`, absolutely
  positioned over an icon (see `NotificationBell`), no border, no label.
- **Progress bar**: `h-2 w-full overflow-hidden rounded-full bg-zinc-200`
  as the track, with an inner `h-full rounded-full bg-amber-400` (or
  `bg-zinc-700`) sized by inline `style={{ width: '...%' }}` since NativeWind
  cannot express an arbitrary runtime percentage as a class.
- **Skeleton block**: the same `h-N rounded-full bg-zinc-200` (or
  `bg-zinc-100` for a lighter shimmer layer) shape reused with no content, for
  loading placeholders. See `## SKELETON LOADING` above for the full pattern.

### MODALS AND SHEETS

Two patterns, chosen by how much the content needs:

**Modal** (`CustomAlert`, `FactModal`) for a short, centered, one-screen
message: React Native's own `Modal` with `transparent animationType="fade"`,
a `bg-black/50` backdrop tapped to dismiss, and a `rounded-2xl bg-white
shadow-2xl` content box capped at `max-w-sm`. `CustomAlert` is the app's
replacement for the native `Alert.alert`, used everywhere so button styling
(`destructive` in red, `cancel` in zinc, default in blue) stays consistent
across platforms; `FactModal` is the same shell without the button row, for a
single dismissible message with a close icon instead.

**Bottom sheet** (`CustomBottomSheetModal`) for content that benefits from a
drag handle and partial screen height: `@gorhom/bottom-sheet`'s
`BottomSheetModal`, snap points passed in as a percentage string (default
`30%`), a `zinc-50` background with a `zinc-100` border and continuous
corners, and a `zinc-200` handle indicator. Used for the badge/level detail
sheet in achievements and similar drill-down content where a full modal would
be too heavy.

Both dismiss on a backdrop tap or an explicit close, never only on a hardware
back press.

### INPUTS

A single visual shape for every text field, whether it is a sign-in field or
the support chat's message box:

```
className="rounded-lg border border-zinc-200 bg-white px-4 py-3 font-product text-zinc-700"
```

with `placeholderTextColor={colors.zinc[400]}` always set explicitly, since
NativeWind's `placeholder:` variant does not reach React Native's
`TextInput`. A field with a trailing icon (the password field's show/hide
toggle) adds `pr-12` and absolutely positions the icon at `right-3 top-3`
rather than using a compound input component.

### CHAT BUBBLES

Introduced with the support agent (`app/screens/support-chat.tsx`), the one
two-party conversational UI in the app: the user's turn is a solid
`bg-zinc-800` bubble with white text, right-aligned; the assistant's turn is a
white `border border-zinc-200` bubble with `zinc-700` text, left-aligned,
`shadow-sm`. Both are `rounded-2xl`, capped at `max-w-[85%]` so a short
message never spans the full width. This is the only place in the app that
distinguishes "my content" from "their content" by fill versus outline rather
than by position alone.

## KNOWN GAPS, NOT FIXED, JUST RECORDED

Updated 25-08-2026. The first two entries below were closed on that date; they
are kept so the record shows what changed.

- CLOSED 25-08-2026. Alert state and the download/view/share/remove logic
  lived in `hooks/useCustomAlert.ts` and `hooks/usePdfDownloads.ts` now, and
  `pdfs.tsx`, `resources.tsx` and `[id].tsx` all consume them. The three
  screens no longer carry their own copies. Skeleton markup is still
  hand rolled per screen: resources.tsx has a local `SectionCardSkeleton`,
  home and content detail keep their own, and they are similar but not
  identical enough to merge without inventing a configuration layer.
- CLOSED 25-08-2026. `screens/[id].tsx` reads downloaded state through
  `usePdfDownloads` and marks each Resources row with a green check and a
  Downloaded label when that file's URL is in the local library. Matching is
  per source URL because storage is keyed by document ID while one document
  can hold several PDFs; pressing Download on any file of an already
  downloaded document still asks the re-download confirmation.
- CLOSED 25-08-2026. `DownloadProgress` and the unused `onProgress`
  parameter were removed from `lib/download.ts`; the new `expo-file-system`
  `File` API exposes no progress callback, so the type described a contract
  nothing could honour. A progress bar would need a chunked download or a
  native module and has not been asked for.

### NOTIFICATION PERMISSIONS, WIRED UP 25-08-2026

`hooks/useNotificationPermissions.ts` sat unimported since Settings moved to
opening system settings directly. It is wired into `settings.tsx` now:

- The App Notifications switch reflects the OS permission (`granted`), not
  token presence. The Bell icon keeps showing registration state.
- Toggling on an undetermined permission fires the native prompt through
  `requestNotificationPermission`; once decided, it opens system settings.
- The hook listens to `AppState`: returning to the foreground re-reads
  permission and, if it became granted while no push token exists, completes
  the backend registration the automatic flow skipped while denied. This is
  the path that used to leave a user unregistered until the next login.

### LOCKED CONTENT VIEW, ADDED 25-08-2026

Documents carrying `unlockPoints` answer 403 with code `CONTENT_LOCKED` from
`GET /content/:id`. `lib/api.ts` surfaces that code through a typed `ApiError`
carrying `code` and `status`, and `screens/[id].tsx` renders a dedicated
Content Locked card for it: lock icon, the backend message naming points
needed versus held, and a Go Back action instead of a retry button that could
never succeed. Every other failure keeps the generic retry error state.
=======

