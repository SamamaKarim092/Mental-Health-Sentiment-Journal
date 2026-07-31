"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth/context";
import { apiFetch } from "@/lib/api/fetcher";
import { ShieldCheck, Mail, Loader2, ArrowRight, RefreshCw, Lock } from "lucide-react";

export default function OtpModal() {
  const { user } = useAuth();
  const [needsOtp, setNeedsOtp] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const hasSentRef = useRef(false);

  // Check 7-day OTP status when user is logged in
  useEffect(() => {
    if (!user) return;

    setUserEmail(user.email || "");

    const checkOtpStatus = async () => {
      try {
        const res = await apiFetch("/api/auth/otp/verify");
        if (res && res.needsOtp) {
          setNeedsOtp(true);
          // Send initial OTP email ONCE when modal first opens
          if (!hasSentRef.current) {
            hasSentRef.current = true;
            sendOtpCode();
          }
        } else {
          setNeedsOtp(false);
        }
      } catch (err) {
        console.error("Failed to check OTP verification status:", err);
        setNeedsOtp(false); // Fallback to allow entry if network fails
      }
    };

    checkOtpStatus();
  }, [user]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const sendOtpCode = async () => {
    setResending(true);
    setErrorMsg("");
    try {
      await apiFetch("/api/auth/otp/send", { method: "POST" });
      setSuccessMsg("Verification code dispatched to your email!");
      setResendCooldown(60);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to send verification code.");
    } finally {
      setResending(false);
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    setErrorMsg("");

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs[index + 1].current?.focus();
    }

    // Auto-submit if all 6 digits entered
    if (newDigits.every((d) => d !== "")) {
      verifyCode(newDigits.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pasted)) {
      const digits = pasted.split("");
      setOtpDigits(digits);
      verifyCode(pasted);
    }
  };

  const verifyCode = async (codeToVerify?: string) => {
    const code = codeToVerify || otpDigits.join("");
    if (code.length < 6 || verifying) return;

    setVerifying(true);
    setErrorMsg("");

    try {
      await apiFetch("/api/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      setNeedsOtp(false); // Successfully verified — unlock dashboard!
    } catch (err: any) {
      setErrorMsg(err.message || "Incorrect verification code. Try again.");
    } finally {
      setVerifying(false);
    }
  };

  if (needsOtp === false || needsOtp === null) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-2xl p-4">
      <div className="w-full max-w-md bg-[#13091B] border border-purple-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glowing background orb */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center space-y-3 mb-6 relative z-10">
          <div className="w-14 h-14 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-purple-500/30">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Security Verification
          </h2>
          <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">
            Enter the 6-digit security code sent to{" "}
            <span className="text-purple-300 font-semibold">{userEmail}</span> to verify your 7-day session.
          </p>
        </div>

        {/* OTP Input Fields */}
        <div className="space-y-6 relative z-10">
          <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
            {otpDigits.map((digit, idx) => (
              <input
                key={idx}
                ref={inputRefs[idx]}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-11 h-13 sm:w-12 sm:h-14 bg-white/5 border border-white/10 focus:border-purple-500 focus:bg-white/10 rounded-xl text-center text-xl sm:text-2xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
              />
            ))}
          </div>

          {/* Messages */}
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center font-medium">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs text-center font-medium">
              {successMsg}
            </div>
          )}

          {/* Action Buttons */}
          <button
            onClick={() => verifyCode()}
            disabled={verifying || otpDigits.some((d) => d === "")}
            className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 text-white font-semibold rounded-xl transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {verifying ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Verify & Continue</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Resend Code */}
          <div className="flex items-center justify-between text-xs pt-2">
            <span className="text-gray-500">Didn&apos;t receive code?</span>
            <button
              onClick={sendOtpCode}
              disabled={resending || resendCooldown > 0}
              className="text-purple-400 hover:text-purple-300 font-semibold disabled:opacity-40 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${resending ? "animate-spin" : ""}`} />
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
