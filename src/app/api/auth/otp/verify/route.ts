// GET  /api/auth/otp/verify — Check if current user needs 7-day OTP verification
// POST /api/auth/otp/verify — Validate 6-digit code and update lastOtpAt in database

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, AuthError } from '@/lib/auth/api';
import { otpStore } from '../send/route';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { lastOtpAt: true, email: true },
    });

    if (!dbUser || !dbUser.lastOtpAt) {
      // First time login — needs OTP
      return NextResponse.json({
        needsOtp: true,
        reason: 'FIRST_LOGIN',
        email: user.email,
      });
    }

    const timeSinceLastOtp = Date.now() - new Date(dbUser.lastOtpAt).getTime();
    const needsOtp = timeSinceLastOtp > SEVEN_DAYS_MS;

    return NextResponse.json({
      needsOtp,
      reason: needsOtp ? 'EXPIRED_7_DAYS' : 'VERIFIED',
      lastOtpAt: dbUser.lastOtpAt,
      email: user.email,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('GET /api/auth/otp/verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: '6-digit verification code is required' }, { status: 400 });
    }

    const cleanCode = code.trim();
    const stored = otpStore.get(user.id);

    if (!stored || stored.expiresAt < Date.now()) {
      return NextResponse.json({ error: 'Verification code has expired. Please request a new code.' }, { status: 400 });
    }

    if (stored.code !== cleanCode) {
      return NextResponse.json({ error: 'Incorrect verification code. Please check your email and try again.' }, { status: 400 });
    }

    // Code matches! Clear stored OTP
    otpStore.delete(user.id);

    // Update lastOtpAt timestamp in user database record
    const now = new Date();
    await prisma.user.upsert({
      where: { id: user.id },
      update: { lastOtpAt: now },
      create: {
        id: user.id,
        email: user.email!,
        name: user.name || null,
        lastOtpAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Email OTP verified successfully. Account secured for 7 days.',
      verifiedAt: now,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('POST /api/auth/otp/verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
