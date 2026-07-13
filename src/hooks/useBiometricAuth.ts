import { useState, useCallback } from "react";

interface BiometricResult {
  verified: boolean;
  method: string;
  timestamp: string;
  error?: string;
}

export const useBiometricAuth = () => {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Check if WebAuthn/biometric is available on this device
  const checkSupport = useCallback(async (): Promise<boolean> => {
    try {
      if (!window.PublicKeyCredential) {
        setIsSupported(false);
        return false;
      }
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      setIsSupported(available);
      return available;
    } catch {
      setIsSupported(false);
      return false;
    }
  }, []);

  // Request biometric verification using WebAuthn
  const requestBiometric = useCallback(async (userId: string): Promise<BiometricResult> => {
    setIsVerifying(true);
    try {
      if (!window.PublicKeyCredential) {
        return {
          verified: false,
          method: "none",
          timestamp: new Date().toISOString(),
          error: "Biometric authentication not supported on this device",
        };
      }

      // Create a challenge for verification
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const userIdBytes = new TextEncoder().encode(userId);

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: "Black Hawk SOC-OS", id: window.location.hostname },
          user: {
            id: userIdBytes,
            name: userId,
            displayName: "Security Officer",
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" },   // ES256
            { alg: -257, type: "public-key" },  // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
          },
          timeout: 60000,
        },
      });

      if (credential) {
        return {
          verified: true,
          method: "biometric",
          timestamp: new Date().toISOString(),
        };
      }

      return {
        verified: false,
        method: "biometric",
        timestamp: new Date().toISOString(),
        error: "Biometric verification was not completed",
      };
    } catch (err: any) {
      // User cancelled or biometric failed
      const errorMsg =
        err.name === "NotAllowedError"
          ? "Biometric verification cancelled or failed"
          : err.name === "SecurityError"
          ? "Biometric not available in this context"
          : `Biometric error: ${err.message}`;

      return {
        verified: false,
        method: "biometric",
        timestamp: new Date().toISOString(),
        error: errorMsg,
      };
    } finally {
      setIsVerifying(false);
    }
  }, []);

  return {
    isSupported,
    isVerifying,
    checkSupport,
    requestBiometric,
  };
};

export default useBiometricAuth;
