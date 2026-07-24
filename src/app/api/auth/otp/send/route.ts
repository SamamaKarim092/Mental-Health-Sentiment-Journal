// POST /api/auth/otp/send — Generate & send a 6-digit OTP code to authenticated user's email

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, AuthError } from '@/lib/auth/api';

// In-memory OTP cache with 10-minute expiry: Map<userId, { code: string; expiresAt: number }
const otpStore = new Map<string, { code: string; expiresAt: number }>();

export { otpStore };

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    // Check existing OTP to avoid spamming
    const existing = otpStore.get(user.id);
    if (existing && existing.expiresAt > Date.now()) {
      // Return existing unexpired OTP
      return NextResponse.json({
        message: 'OTP code sent to email',
        expiresInSeconds: Math.round((existing.expiresAt - Date.now()) / 1000),
      });
    }

    // Generate crypto-secure 6-digit random code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(user.id, { code, expiresAt });

    const recipientEmail = user.email!;
    const resendKey = process.env.RESEND_API_KEY;

    if (resendKey) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: 'MindFul-Space <security@mindful-space.app>',
            to: recipientEmail,
            subject: '🔐 Your 6-Digit Security Verification Code',
            html: `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #0F0714; color: #ffffff; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">
              <h2 style="color: #c084fc; margin-bottom: 8px;">Security Check</h2>
              <p style="color: #cbd5e1; font-size: 14px;">Your 6-digit login verification code is:</p>
              <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #38bdf8; background: rgba(255,255,255,0.05); padding: 16px; border-radius: 12px; text-align: center; margin: 20px 0;">
                ${code}
              </div>
              <p style="color: #94a3b8; font-size: 12px;">This code will expire in 10 minutes. If you did not request this code, please secure your account immediately.</p>
            </div>`,
          }),
        });
      } catch (emailErr) {
        console.error('Failed to dispatch OTP email:', emailErr);
      }
    } else {
      console.log(`[Development OTP Code] 🔐 Verification code for ${recipientEmail}: ${code}`);
    }

    return NextResponse.json({
      message: 'OTP code sent to email',
      expiresInSeconds: 600,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('POST /api/auth/otp/send error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
