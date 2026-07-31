// GET  /api/user/reminders — Get user reminder settings
// POST /api/user/reminders — Update reminder preferences (reminderEnabled, reminderTime)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, AuthError } from '@/lib/auth/api';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { reminderEnabled: true, reminderTime: true },
    });

    return NextResponse.json(
      dbUser || { reminderEnabled: true, reminderTime: '20:00' }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('GET /api/user/reminders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    const body = await request.json();

    const { reminderEnabled, reminderTime } = body;

    const updateData: any = {};
    if (typeof reminderEnabled === 'boolean') updateData.reminderEnabled = reminderEnabled;
    if (typeof reminderTime === 'string') updateData.reminderTime = reminderTime;

    const updated = await prisma.user.upsert({
      where: { id: user.id },
      update: updateData,
      create: {
        id: user.id,
        email: user.email!,
        name: user.name || null,
        reminderEnabled: reminderEnabled ?? true,
        reminderTime: reminderTime || '20:00',
      },
      select: { reminderEnabled: true, reminderTime: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('POST /api/user/reminders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
