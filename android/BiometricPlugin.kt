package dev.wefter.bridge

import android.content.Context
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricManager.Authenticators.BIOMETRIC_STRONG
import androidx.biometric.BiometricManager.Authenticators.BIOMETRIC_WEAK
import androidx.biometric.BiometricManager.Authenticators.DEVICE_CREDENTIAL
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import org.json.JSONObject

class BiometricPlugin(context: Context, dispatcher: BridgeDispatcher) :
        WefterPlugin(context, dispatcher) {

        private val activity: FragmentActivity
                get() = context as FragmentActivity

        @WefterMethod
        fun isAvailable(payload: JSONObject, callback: (Result<Any>) -> Unit) {
                val allowDeviceCredential = payload.optBoolean("allowDeviceCredential", false)
                val availability =
                        BiometricManager.from(activity)
                                .canAuthenticate(authenticatorsFor(allowDeviceCredential))

                if (availability == BiometricManager.BIOMETRIC_SUCCESS) {
                        resolve(callback, JSONObject().put("available", true))
                        return
                }

                val (code, message) = describeUnavailable(availability)
                resolve(
                        callback,
                        JSONObject()
                                .put("available", false)
                                .put("code", code)
                                .put("message", message)
                )
        }

        @WefterMethod
        fun authenticate(payload: JSONObject, callback: (Result<Any>) -> Unit) {
                val title = payload.optString("title", "Authenticate")
                val subtitle = payload.optString("subtitle", "").takeIf { it.isNotBlank() }
                val cancelText = payload.optString("cancelText", "Cancel")
                val allowDeviceCredential = payload.optBoolean("allowDeviceCredential", false)
                val authenticators = authenticatorsFor(allowDeviceCredential)

                val availability = BiometricManager.from(activity).canAuthenticate(authenticators)
                if (availability != BiometricManager.BIOMETRIC_SUCCESS) {
                        val (code, message) = describeUnavailable(availability)
                        reject(callback, code, message)
                        return
                }

                activity.runOnUiThread {
                        val executor = ContextCompat.getMainExecutor(activity)

                        val promptCallback =
                                object : BiometricPrompt.AuthenticationCallback() {
                                        override fun onAuthenticationSucceeded(
                                                result: BiometricPrompt.AuthenticationResult
                                        ) {
                                                resolve(callback, JSONObject().put("success", true))
                                        }

                                        override fun onAuthenticationError(
                                                errorCode: Int,
                                                errString: CharSequence
                                        ) {
                                                val userInitiated =
                                                        errorCode ==
                                                                BiometricPrompt
                                                                        .ERROR_USER_CANCELED ||
                                                                errorCode ==
                                                                        BiometricPrompt
                                                                                .ERROR_NEGATIVE_BUTTON ||
                                                                errorCode ==
                                                                        BiometricPrompt
                                                                                .ERROR_CANCELED
                                                val lockedOut =
                                                        errorCode ==
                                                                BiometricPrompt.ERROR_LOCKOUT ||
                                                                errorCode ==
                                                                        BiometricPrompt
                                                                                .ERROR_LOCKOUT_PERMANENT

                                                when {
                                                        userInitiated ->
                                                                reject(
                                                                        callback,
                                                                        "USER_CANCELED",
                                                                        "Authentication was canceled"
                                                                )
                                                        lockedOut ->
                                                                reject(
                                                                        callback,
                                                                        "LOCKED_OUT",
                                                                        errString.toString()
                                                                )
                                                        else ->
                                                                reject(
                                                                        callback,
                                                                        "AUTH_ERROR",
                                                                        errString.toString()
                                                                )
                                                }
                                        }

                                        override fun onAuthenticationFailed() {}
                                }

                        val builder =
                                BiometricPrompt.PromptInfo.Builder()
                                        .setTitle(title)
                                        .apply { subtitle?.let { setSubtitle(it) } }
                                        .setAllowedAuthenticators(authenticators)

                        if (!allowDeviceCredential) {
                                builder.setNegativeButtonText(cancelText)
                        }

                        BiometricPrompt(activity, executor, promptCallback)
                                .authenticate(builder.build())
                }
        }

        private fun authenticatorsFor(allowDeviceCredential: Boolean): Int =
                if (allowDeviceCredential) {
                        BIOMETRIC_STRONG or BIOMETRIC_WEAK or DEVICE_CREDENTIAL
                } else {
                        BIOMETRIC_STRONG or BIOMETRIC_WEAK
                }

        private fun describeUnavailable(availability: Int): Pair<String, String> =
                when (availability) {
                        BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE ->
                                "NO_HARDWARE" to "This device has no biometric hardware."
                        BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE ->
                                "HW_UNAVAILABLE" to "Biometric hardware is currently unavailable."
                        BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED ->
                                "NONE_ENROLLED" to
                                        "No fingerprint or face is enrolled on this device."
                        BiometricManager.BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED ->
                                "SECURITY_UPDATE_REQUIRED" to
                                        "A security update is required before biometrics can be used."
                        BiometricManager.BIOMETRIC_ERROR_UNSUPPORTED ->
                                "UNSUPPORTED" to
                                        "Biometric authentication is not supported on this device."
                        else -> "UNAVAILABLE" to "Biometric authentication is not available."
                }
}
