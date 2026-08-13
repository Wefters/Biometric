import { invokeNative } from "@wefterjs/core";

export type BiometryType = "touchId" | "faceId" | "opticId" | "none";

export interface BiometricAvailabilityOptions {
  allowDeviceCredential?: boolean;
}

export interface BiometricAvailability {
  available: boolean;
  biometryType?: BiometryType;
  code?: string;
  message?: string;
}

export interface AuthenticateOptions {
  title?: string;
  subtitle?: string;
  cancelText?: string;
  allowDeviceCredential?: boolean;
  timeoutMs?: number;
}

export interface AuthenticateResult {
  success: true;
}

const DEFAULT_AUTHENTICATE_TIMEOUT_MS = 60_000;

export const Biometric = {
  isAvailable(
    options: BiometricAvailabilityOptions = {},
  ): Promise<BiometricAvailability> {
    return invokeNative("biometric", "isAvailable", options);
  },
  authenticate(options: AuthenticateOptions = {}): Promise<AuthenticateResult> {
    const { timeoutMs, ...payload } = options;
    return invokeNative("biometric", "authenticate", payload, {
      timeoutMs: timeoutMs ?? DEFAULT_AUTHENTICATE_TIMEOUT_MS,
    });
  },
};
