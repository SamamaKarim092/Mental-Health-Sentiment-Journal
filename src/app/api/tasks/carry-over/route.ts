// POST /api/tasks/carry-over — Push incomplete tasks from one date to another

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, AuthError } from '@/lib/auth/api';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    const body = await request.json();
    const { fromDate, toDate } = body;

    if (!fromDate || !toDate) {
      return NextResponse.json({ error: 'fromDate and toDate are required' }, { status: 400 });
    }

    const from = new Date(fromDate + 'T00:00:00.000Z');
    const to = new Date(toDate + 'T00:00:00.000Z');

    // Find all incomplete tasks from the source date
    const incompleteTasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        date: from,
        completed: false,
      },
    });

    if (incompleteTasks.length === 0) {
      return NextResponse.json({ message: 'No incomplete tasks to carry over', carried: 0 });
    }

    // Check which tasks already exist on the target date (avoid duplicates)
    const existingTasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        date: to,
        pushedFrom: from,
      },
    });
    const existingTexts = new Set(existingTasks.map((t) => t.text));

    // Create new tasks on the target date for ones not already carried
    const tasksToCreate = incompleteTasks
      .filter((t) => !existingTexts.has(t.text))
      .map((t) => ({
        userId: user.id,
        text: t.text,
        date: to,
        priority: t.priority,
        pushedFrom: from,
        completed: false,
      }));

    if (tasksToCreate.length > 0) {
      await prisma.task.createMany({ data: tasksToCreate });
    }

    return NextResponse.json({
      message: `Carried over ${tasksToCreate.length} task(s)`,
      carried: tasksToCreate.length,
      skipped: incompleteTasks.length - tasksToCreate.length,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('POST /api/tasks/carry-over error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
