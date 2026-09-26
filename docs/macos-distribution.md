# macOS distribution

Signed releases use a `.dmg` downloaded directly from [GitHub Releases](https://github.com/kent-tokyo/acorde-composer/releases). Do not put a DMG inside a ZIP file.

For no-cost distribution, use the browser [Playground](https://kent-tokyo.github.io/acorde-composer/playground/) as the primary user experience. A native macOS build may be offered as an **unsigned experimental DMG** for technically confident users; it is not a signed or notarized release.

## No-cost experimental DMG

On macOS, run:

```sh
npm run dist:mac:unsigned-dmg
```

This creates `dist/Acorde Composer-<version>-arm64-unsigned.dmg`. It explicitly disables automatic code-signing discovery and notarization, even if signing credentials exist on the build machine. Upload that DMG directly to a GitHub Release; do not rename it to a signed build or claim that it passes Gatekeeper. Users may need to use Finder's Control-click **Open** or macOS Privacy & Security's **Open Anyway** after verifying that it came from the official Releases page.

An unsigned ZIP remains available for users who need it:

```sh
npm run dist:mac:unsigned
```

It creates `dist/Acorde Composer-<version>-arm64-unsigned.zip` with `ditto` so the `.app` bundle metadata and permissions are preserved.

## Prerequisites

- A macOS host with Xcode command-line tools.
- A `Developer ID Application` signing identity, exposed as `CSC_NAME` or `CSC_LINK`.
- One notarization credential strategy:
  - `ACORDE_NOTARY_KEYCHAIN_PROFILE` (recommended), or
  - `APPLE_API_KEY`, `APPLE_API_KEY_ID`, and `APPLE_API_ISSUER`, or
  - `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, and `APPLE_TEAM_ID`.

Secrets must remain in the Keychain or CI secret store; never commit them.

## Build and publish

```sh
npm run dist:mac
shasum -a 256 "dist/Acorde Composer-<version>-arm64.dmg"
gh release upload "v<version>" "dist/Acorde Composer-<version>-arm64.dmg"
```

`npm run dist:mac` fails before packaging when signing or notarization credentials are absent. It creates an Apple-silicon DMG, notarizes and staples the contained app, then records the actual DMG checksum in `dist/release-artifact-manifest.json`.

Before uploading, install the DMG on a clean macOS machine, launch it normally through Gatekeeper, and record the result in release QA. Build a separate `x64` DMG if Intel Mac support is required.
