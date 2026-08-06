// Global OTP Store Singleton across Next.js API routes & hot reloads
// Prevents OTP map from being cleared when Next.js re-evaluates modules

const globalForOtp = globalThis as unknown as {
  otpStore: Map<string, { code: string; expiresAt: number }> | undefined;
};

export const otpStore =
  globalForOtp.otpStore ??
  new Map<string, { code: string; expiresAt: number }>();

if (process.env.NODE_ENV !== 'production') {
  globalForOtp.otpStore = otpStore;
}
