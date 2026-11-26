/**
 * Authenticates the user with Face ID, Touch ID or the device's biometrics, optionally falling back to the
 * device passcode.
 */

import { invokeNative } from "@wefterjs/core";

/** Kind of biometric sensor available. */
export type BiometryType = "touchId" | "faceId" | "opticId" | "none";

/** `allowDeviceCredential` also counts the device passcode as available. */
export interface BiometricAvailabilityOptions {
  allowDeviceCredential?: boolean;
}

/**
 * Whether authentication can be used. When it cannot, `code` and `message` say why (for example no
 * biometrics enrolled).
 */
export interface BiometricAvailability {
  available: boolean;
  biometryType?: BiometryType;
  code?: string;
  message?: string;
}

/**
 * Text for the system prompt, whether the passcode may be used instead, and how long to wait for the user
 * (default one minute).
 */
export interface AuthenticateOptions {
  title?: string;
  subtitle?: string;
  cancelText?: string;
  allowDeviceCredential?: boolean;
  timeoutMs?: number;
}

/** Returned when the user authenticated. A failure or cancellation rejects instead. */
export interface AuthenticateResult {
  success: true;
}

/** The prompt waits for the user, so it needs longer than the bridge's default timeout. */
const DEFAULT_AUTHENTICATE_TIMEOUT_MS = 60_000;

/** The Biometric plugin. */
export const Biometric = {
  /** Whether biometric (or passcode) authentication can be used, and which sensor the device has. */
  isAvailable(options: BiometricAvailabilityOptions = {}): Promise<BiometricAvailability> {
    return invokeNative("biometric", "isAvailable", options);
  },
  /**
   * Shows the system authentication prompt.
   *
   * @throws {WefterBridgeError} When the user cancels or authentication fails.
   */
  authenticate(options: AuthenticateOptions = {}): Promise<AuthenticateResult> {
    const { timeoutMs, ...payload } = options;
    return invokeNative("biometric", "authenticate", payload, {
      timeoutMs: timeoutMs ?? DEFAULT_AUTHENTICATE_TIMEOUT_MS,
    });
  },
};
