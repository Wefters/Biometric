# @wefterjs/biometric

Official Wefter plugin for native biometric authentication (Face ID, Touch ID, Android BiometricPrompt).

---

## Features

- 🔒 **Native Security**: Uses Android `androidx.biometric.BiometricPrompt` & iOS `LocalAuthentication` (`LAContext`).
- 👆 **Multi-Biometry**: Supports Fingerprint, Face ID, Touch ID, and Iris authentication.
- 🔑 **Device Passcode Fallback**: Optional OS passcode fallback if biometrics are not configured or fail.
- ⚡ **Zero Reflection**: Routes direct to Kotlin/Swift dispatchers with `invokeNative`.

---

## Installation & Setup

1. Add the plugin to your Wefter project:

```bash
wefter add @wefterjs/biometric
```

2. Synchronize native projects:

```bash
wefter sync
```

---

## Native Permissions & Manifest Configuration

- **Android** (`AndroidManifest.xml`): Automatically requests `<uses-permission android:name="android.permission.USE_BIOMETRIC" />`.
- **iOS** (`Info.plist`): Automatically injects `NSFaceIDUsageDescription`.

---

## JavaScript API Reference

Import `invokeNative` from `@wefterjs/core`:

```ts
import { invokeNative } from "@wefterjs/core";
```

### 1. `isAvailable()`

Checks if biometric hardware is present, enrolled, and ready for authentication on the device.

```ts
interface BiometricAvailability {
  available: boolean;
  biometryType: "face" | "touch" | "iris" | "none";
  error?: string;
}

const status = await invokeNative<BiometricAvailability>("biometric", "isAvailable");

if (status.available) {
  console.log(`Biometrics supported: ${status.biometryType}`);
} else {
  console.log(`Biometrics unavailable: ${status.error}`);
}
```

### 2. `authenticate(options)`

Triggers the OS native biometric prompt dialog.

```ts
interface AuthenticateOptions {
  reason?: string; // Display prompt reason (e.g. "Confirm your identity to unlock funds")
  fallbackTitle?: string; // Custom button label for OS passcode fallback
  allowDeviceCredential?: boolean; // Allow PIN / Pattern / Passcode fallback
}

interface AuthenticateResult {
  success: boolean;
  error?: string;
}

try {
  const result = await invokeNative<AuthenticateResult>("biometric", "authenticate", {
    reason: "Authenticate to access your secure wallet",
    fallbackTitle: "Use Device PIN",
    allowDeviceCredential: true,
  });

  if (result.success) {
    console.log("Authentication successful!");
  }
} catch (error) {
  console.error("Biometric prompt cancelled or failed:", error);
}
```

---

## Complete Usage Example

```ts
import { invokeNative } from "@wefterjs/core";

export async function unlockApp(): Promise<boolean> {
  const status = await invokeNative<{ available: boolean }>("biometric", "isAvailable");

  if (!status.available) {
    alert("Biometric hardware is not configured on this device.");
    return false;
  }

  const response = await invokeNative<{ success: boolean }>("biometric", "authenticate", {
    reason: "Log into your account",
  });

  return response.success;
}
```
