// GET  /api/tasks?date=YYYY-MM-DD — List tasks for a specific date
// POST /api/tasks — Create a new task

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, AuthError } from '@/lib/auth/api';
import { TaskPriority } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    if (!dateParam) {
      return NextResponse.json({ error: 'date parameter is required (YYYY-MM-DD)' }, { status: 400 });
    }

    const date = new Date(dateParam + 'T00:00:00.000Z');

    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        date: date,
      },
      orderBy: [
        { completed: 'asc' },
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('GET /api/tasks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    const body = await request.json();
    const { text, date, priority } = body;

    if (!text || !date) {
      return NextResponse.json({ error: 'text and date are required' }, { status: 400 });
    }

    const taskDate = new Date(date + 'T00:00:00.000Z');
    const taskPriority = priority && Object.values(TaskPriority).includes(priority)
      ? priority as TaskPriority
      : TaskPriority.MEDIUM;

    const task = await prisma.task.create({
      data: {
        userId: user.id,
        text: text.trim(),
        date: taskDate,
        priority: taskPriority,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('POST /api/tasks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
