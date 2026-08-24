# STUDZEE MOBILE DESIGN, EXPO

Reference for how the mobile client is put together: navigation, the
notification pipeline, the custom alert and bottom sheet, how a downloaded
PDF is tracked and viewed, and the skeleton loading pattern. Written against
what the code actually does, not what it was meant to do.

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
