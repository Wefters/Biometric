import Foundation
import LocalAuthentication

final class BiometricPlugin: WefterPlugin {

    // @WefterMethod
    func isAvailable(payload: [String: Any], callback: @escaping (Result<Any, Error>) -> Void) throws {
        let allowDeviceCredential = payload["allowDeviceCredential"] as? Bool ?? false
        let context = LAContext()
        let policy: LAPolicy = allowDeviceCredential
            ? .deviceOwnerAuthentication
            : .deviceOwnerAuthenticationWithBiometrics

        var evalError: NSError?
        guard context.canEvaluatePolicy(policy, error: &evalError) else {
            let (code, message) = BiometricPlugin.describeUnavailable(evalError)
            resolve(callback, data: ["available": false, "code": code, "message": message])
            return
        }

        resolve(callback, data: [
            "available": true,
            "biometryType": BiometricPlugin.biometryTypeName(context.biometryType),
        ])
    }

    // @WefterMethod
    func authenticate(payload: [String: Any], callback: @escaping (Result<Any, Error>) -> Void) throws {
        let title = payload["title"] as? String
        let subtitle = payload["subtitle"] as? String
        let reason = subtitle ?? title ?? "Authenticate to continue"
        let allowDeviceCredential = payload["allowDeviceCredential"] as? Bool ?? false

        let context = LAContext()
        if let cancelText = payload["cancelText"] as? String {
            context.localizedCancelTitle = cancelText
        }

        let policy: LAPolicy = allowDeviceCredential
            ? .deviceOwnerAuthentication
            : .deviceOwnerAuthenticationWithBiometrics

        var evalError: NSError?
        guard context.canEvaluatePolicy(policy, error: &evalError) else {
            let (code, message) = BiometricPlugin.describeUnavailable(evalError)
            reject(callback, code: code, message: message)
            return
        }

        context.evaluatePolicy(policy, localizedReason: reason) { [weak self] success, authenticationError in
            guard let self = self else { return }
            if success {
                self.resolve(callback, data: ["success": true])
            } else {
                let (code, message) = BiometricPlugin.describeFailure(authenticationError)
                self.reject(callback, code: code, message: message)
            }
        }
    }

    private static func biometryTypeName(_ type: LABiometryType) -> String {
        switch type {
        case .faceID: return "faceId"
        case .touchID: return "touchId"
        case .opticID: return "opticId"
        default: return "none"
        }
    }

    private static func describeUnavailable(_ error: NSError?) -> (code: String, message: String) {
        guard let laError = error as? LAError else {
            return ("UNAVAILABLE", "Biometric authentication is not available on this device.")
        }

        switch laError.code {
        case .biometryNotAvailable:
            return ("HW_UNAVAILABLE", "Biometric hardware is currently unavailable.")
        case .biometryNotEnrolled:
            return ("NONE_ENROLLED", "No Face ID or Touch ID is enrolled on this device.")
        case .biometryLockout:
            return ("LOCKED_OUT", "Biometric authentication is temporarily locked. Use the device passcode to unlock it.")
        case .passcodeNotSet:
            return ("PASSCODE_NOT_SET", "Set a device passcode to use biometric authentication.")
        default:
            return ("UNAVAILABLE", laError.localizedDescription)
        }
    }

    private static func describeFailure(_ error: Error?) -> (code: String, message: String) {
        guard let laError = error as? LAError else {
            return ("AUTH_ERROR", error?.localizedDescription ?? "Biometric authentication failed.")
        }

        switch laError.code {
        case .userCancel, .systemCancel, .appCancel:
            return ("USER_CANCELED", "Authentication was canceled.")
        case .userFallback:
            return ("USER_CANCELED", "User chose to enter the device passcode instead.")
        case .biometryLockout:
            return ("LOCKED_OUT", "Too many attempts. Biometric authentication is temporarily locked.")
        case .authenticationFailed:
            return ("AUTH_FAILED", "Biometric authentication failed.")
        default:
            return ("AUTH_ERROR", laError.localizedDescription)
        }
    }
}
