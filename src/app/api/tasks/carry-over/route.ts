// POST /api/tasks/carry-over — Push incomplete tasks from one date to another (moves tasks to target date)

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

    // Update incomplete tasks: move their date to `to` and record `pushedFrom: from`
    const updated = await prisma.task.updateMany({
      where: {
        userId: user.id,
        date: from,
        completed: false,
      },
      data: {
        date: to,
        pushedFrom: from,
      },
    });

    return NextResponse.json({
      message: `Carried over ${updated.count} task(s)`,
      carried: updated.count,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('POST /api/tasks/carry-over error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
