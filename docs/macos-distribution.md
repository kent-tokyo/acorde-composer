# macOS distribution

Use the browser [Playground](https://kent-tokyo.github.io/acorde-composer/playground/) as the no-cost default. Native builds come in two forms: an **experimental ad-hoc-signed DMG/ZIP** or a Developer ID-signed and notarized DMG. Publish either form directly through [GitHub Releases](https://github.com/kent-tokyo/acorde-composer/releases); do not wrap a DMG in a ZIP.

## No-cost experimental DMG

On macOS, run:

```sh
npm run dist:mac:unsigned-dmg
```

This creates `dist/Acorde Composer-<version>-arm64-unsigned.dmg`. The script packages the app directory, applies an ad-hoc signature to the complete bundle, creates the DMG, verifies the image, mounts it read-only, and runs strict `codesign` verification on the embedded app. It does not use a Developer ID certificate or notarization, so never claim that it passes Gatekeeper. After confirming the official download source, users may need Finder's Control-click **Open** or Privacy & Security's **Open Anyway**.

Build from the clean commit that will be tagged. Do not attach an artifact built from another commit: its manifest, QA report, and source commit would not match.

An experimental ad-hoc-signed ZIP remains available for users who need it:

```sh
npm run dist:mac:unsigned
```

This creates `dist/Acorde Composer-<version>-arm64-unsigned.zip` with `.app` metadata and permissions preserved. The filename retains `unsigned` to distinguish it from a trusted Developer ID release; ad-hoc signing only seals bundle integrity on the build machine.

## Signed build

Use a macOS host with Xcode command-line tools, a `Developer ID Application` identity in `CSC_NAME` or `CSC_LINK`, and one notarization method: `ACORDE_NOTARY_KEYCHAIN_PROFILE` (recommended), App Store Connect API key variables, or Apple ID variables. Keep secrets in Keychain or CI; never commit them.

```sh
npm run dist:mac
shasum -a 256 "dist/Acorde Composer-<version>-arm64.dmg"
gh release upload "v<version>" "dist/Acorde Composer-<version>-arm64.dmg"
```

`npm run dist:mac` fails when signing or notarization credentials are absent. It creates an Apple-silicon DMG, notarizes and staples the app, and records the DMG checksum in `dist/release-artifact-manifest.json`.

Build from the commit that will be tagged so source, manifest, and QA refer to the same commit. Before uploading, install the DMG on a clean Mac, launch it through Gatekeeper, and record release QA. Build a separate `x64` artifact for Intel Macs.
