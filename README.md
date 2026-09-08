# @wefterjs/biometric

Official Wefter plugin for native biometric authentication on Android (BiometricPrompt) and iOS (LocalAuthentication).

## Features

- Check hardware presence and user enrollment for Face ID, Touch ID, or Optic ID.
- Display native OS authentication dialogs with configurable titles and cancel buttons.
- Support optional fallback to device PIN, pattern, or passcode credentials.
- Configurable authentication timeout protection.

## Installation and setup

Install the plugin package in your Wefter application:

```bash
wefter add @wefterjs/biometric
wefter sync
```

### Native permissions and dependencies

When synchronized:

- Android automatically receives the `android.permission.USE_BIOMETRIC` permission and the `androidx.biometric:biometric:1.1.0` Gradle dependency.
- iOS automatically configures the `NSFaceIDUsageDescription` key in `Info.plist`.

## JavaScript API reference

Import `Biometric` from `@wefterjs/biometric`:

```ts
import { Biometric } from "@wefterjs/biometric";
```

### Check biometric availability

Verify if biometric authentication hardware exists, is enrolled, and is currently available:

```ts
const status = await Biometric.isAvailable({
  allowDeviceCredential: true, // Allow device PIN or passcode as alternative
});

if (status.available) {
  console.log("Supported biometry type:", status.biometryType);
  // "touchId", "faceId", "opticId", or "none"
} else {
  console.log("Biometrics unavailable:", status.message, status.code);
}
```

### Authenticate user

Prompt the user to authenticate using biometric sensors:

```ts
try {
  const result = await Biometric.authenticate({
    title: "Verify your identity",
    subtitle: "Confirm biometric credentials to access your account",
    cancelText: "Cancel",
    allowDeviceCredential: true,
    timeoutMs: 30000,
  });

  if (result.success) {
    console.log("Authentication confirmed");
  }
} catch (error) {
  console.error("Authentication cancelled or failed:", error);
}
```

The call resolves with `{ success: true }` upon successful identity confirmation. If the user cancels the prompt, fails too many attempts, or times out, the returned Promise rejects with a `WefterBridgeError`.

## Platform implementation notes

### Android

- Uses `androidx.biometric.BiometricPrompt` with `BiometricManager.Authenticators.BIOMETRIC_STRONG`.
- When `allowDeviceCredential` is true, adds `BIOMETRIC_WEAK` and `DEVICE_CREDENTIAL` flags to allow pattern, PIN, or password unlock.

### iOS

- Uses Apple's `LocalAuthentication` framework (`LAContext`).
- Validates policy using `deviceOwnerAuthenticationWithBiometrics` or `deviceOwnerAuthentication` based on the `allowDeviceCredential` option.
- Queries `biometryType` on `LAContext` to distinguish between Touch ID, Face ID, and Optic ID.

## License

[MIT](LICENSE) © 2026 Sandip Ghimire
