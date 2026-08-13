// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { installMockBridge, uninstallMockBridge } from "@wefterjs/core/testing";
import { WefterBridgeError } from "@wefterjs/core";
import { Biometric } from "../src/index.js";

afterEach(() => {
  uninstallMockBridge();
});

describe("Biometric.isAvailable", () => {
  it("resolves with what the native side reports when available", async () => {
    installMockBridge({
      biometric: (method) => {
        if (method === "isAvailable") return { available: true, biometryType: "faceId" };
        throw new Error(`unexpected method ${method}`);
      },
    });

    const result = await Biometric.isAvailable();

    expect(result).toEqual({ available: true, biometryType: "faceId" });
  });

  it("resolves (does not reject) when biometrics aren't available", async () => {
    installMockBridge({
      biometric: () => ({ available: false, code: "NONE_ENROLLED", message: "No fingerprint enrolled" }),
    });

    const result = await Biometric.isAvailable();

    expect(result.available).toBe(false);
    expect(result.code).toBe("NONE_ENROLLED");
  });

  it("forwards allowDeviceCredential in the payload", async () => {
    installMockBridge({
      biometric: (_method, payload) => {
        expect(payload).toEqual({ allowDeviceCredential: true });
        return { available: true };
      },
    });

    await Biometric.isAvailable({ allowDeviceCredential: true });
  });
});

describe("Biometric.authenticate", () => {
  it("resolves with success on a granted prompt", async () => {
    installMockBridge({
      biometric: (method) => {
        if (method === "authenticate") return { success: true };
        throw new Error(`unexpected method ${method}`);
      },
    });

    const result = await Biometric.authenticate({ title: "Sign in" });

    expect(result).toEqual({ success: true });
  });

  it("forwards prompt options in the payload, without leaking timeoutMs into it", async () => {
    installMockBridge({
      biometric: (_method, payload) => {
        expect(payload).toEqual({ title: "Sign in", subtitle: "Confirm it's you" });
        return { success: true };
      },
    });

    await Biometric.authenticate({ title: "Sign in", subtitle: "Confirm it's you", timeoutMs: 5000 });
  });

  it("surfaces a denial as a WefterBridgeError the app can branch on", async () => {
    installMockBridge({
      biometric: () => {
        throw new Error("Authentication was canceled");
      },
    });

    await expect(Biometric.authenticate()).rejects.toBeInstanceOf(WefterBridgeError);
    await expect(Biometric.authenticate()).rejects.toMatchObject({
      code: "MOCK_ERROR",
      message: "Authentication was canceled",
    });
  });
});
