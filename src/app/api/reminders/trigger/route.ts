// POST /api/reminders/trigger — Cron/trigger route to dispatch daily journaling reminder emails

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const secret = process.env.CRON_SECRET || process.env.N8N_WEBHOOK_SECRET;

    if (secret && authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find users with reminders enabled
    const usersWithReminders = await prisma.user.findMany({
      where: { reminderEnabled: true },
      include: {
        entries: {
          where: { createdAt: { gte: today } },
          select: { id: true },
        },
      },
    });

    // Filter users who HAVEN'T written an entry today
    const usersToRemind = usersWithReminders.filter((u) => u.entries.length === 0);

    const resendKey = process.env.RESEND_API_KEY;
    const sentList: string[] = [];

    for (const u of usersToRemind) {
      const recipientEmail = u.email;
      const userName = u.name || 'friend';

      if (resendKey) {
        try {
          const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
          const resendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${resendKey}`,
            },
            body: JSON.stringify({
              from: `MindFul-Space <${fromEmail}>`,
              to: recipientEmail,
              subject: '🌿 Time for your daily pause — MindFul Space',
              html: `<div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background: #0F0714; color: #ffffff; border-radius: 16px;">
                <h2 style="color: #c084fc;">Hi ${userName},</h2>
                <p style="color: #e2e8f0; line-height: 1.6;">How was your day? Take a quiet moment to reflect on your thoughts, emotions, and accomplishments.</p>
                <div style="margin: 25px 0;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/journal" style="background: linear-gradient(135deg, #a855f7, #ec4899); color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 12px; display: inline-block;">Write Journal Entry 📝</a>
                </div>
                <p style="color: #64748b; font-size: 12px;">You are receiving this because you enabled daily reminders in MindFul-Space. You can disable this anytime in Settings.</p>
              </div>`,
            }),
          });

          if (!resendRes.ok) {
            const errText = await resendRes.text();
            console.error(`Resend API error sending reminder to ${recipientEmail}:`, resendRes.status, errText);
          } else {
            sentList.push(recipientEmail);
          }
        } catch (emailErr) {
          console.error(`Failed to send reminder to ${recipientEmail}:`, emailErr);
        }
      } else {
        // Fallback log for development
        console.log(`[Development Reminder] Email dispatched to ${recipientEmail} (${userName}) at ${u.reminderTime}`);
        sentList.push(recipientEmail);
      }
    }

    return NextResponse.json({
      message: `Dispatched daily reminders to ${sentList.length} user(s)`,
      recipients: sentList,
    });
  } catch (error) {
    console.error('POST /api/reminders/trigger error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
