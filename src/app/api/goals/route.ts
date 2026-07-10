// GET  /api/goals — List all long-term goals for the user
// POST /api/goals — Create a new goal

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, AuthError } from '@/lib/auth/api';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    const goals = await prisma.goal.findMany({
      where: { userId: user.id },
      orderBy: [
        { completed: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(goals);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('GET /api/goals error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    const body = await request.json();
    const { text, category } = body;

    if (!text) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    const goal = await prisma.goal.create({
      data: {
        userId: user.id,
        text: text.trim(),
        category: category?.trim() || null,
      },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('POST /api/goals error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
