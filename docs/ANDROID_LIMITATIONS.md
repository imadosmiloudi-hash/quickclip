# Android limitations (honest)

QUICKCLIP is a custom **Input Method Editor (IME)**. What it can do depends on the focused app (Messenger, WhatsApp, SMS, Chrome, …), not on QUICKCLIP itself.

## Text

- **Supported everywhere a text field is focused.** The IME calls `InputConnection.commitText(...)`.
- QUICKCLIP **cannot auto-send** a Messenger message. Sending is the host app’s Send button. Do not expect background posting.

## Media (image / audio / video)

1. **Preferred:** `InputConnection.commitContent` / `InputContentInfo` when the editor advertises MIME types via `EditorInfo.contentMimeTypes`.
2. **Fallback:** `Intent.ACTION_SEND` with a `FileProvider` `content://` URI, plus a toast explaining why.
3. **Demo items** without a local file (seed Voice/Video/Image) cannot be inserted until you import a real file via SAF.

Messenger **often does not** accept `commitContent` for arbitrary IME media. In that case the share sheet is the fastest official path. QUICKCLIP never scrapes the Messenger UI to force an attachment.

## What the keyboard does **not** do

- Read Messenger (or any) conversations.
- Upload keystrokes, passwords, cards, or OTPs.
- Bypass Android security or other apps’ private storage.
- Insert media into apps that reject both `commitContent` and share.

## Optional AccessibilityService

Declared in the manifest **`android:enabled="false"`**. It is a stub: no window scraping, no auto-tap. Settings → Automation is OFF by default. Core keyboard works without it. Do not enable on password fields.

## Permissions

- `INTERNET` / `ACCESS_NETWORK_STATE` — optional cloud sync only.
- Media import uses the Storage Access Framework (SAF) picker; copies land in `filesDir/media`.
- FileProvider authority: `${applicationId}.fileprovider`.

## RTL / languages

`values/`, `values-ar/` (RTL via `supportsRtl`), `values-fr/`. System locale picks strings.
