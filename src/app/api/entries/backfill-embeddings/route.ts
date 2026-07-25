// POST /api/entries/backfill-embeddings — Generate RAG embeddings for existing entries
// Run this once after installing RAG to backfill entries created before the feature existed.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, AuthError } from '@/lib/auth/api';
import { storeEntryEmbedding } from '@/lib/rag';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    // Find all entries for this user that don't have an embedding yet
    const entries = await prisma.entry.findMany({
      where: {
        userId: user.id,
        embedding: null, // Only entries without embeddings
      },
      select: {
        id: true,
        title: true,
        content: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (entries.length === 0) {
      return NextResponse.json({
        message: 'All entries already have embeddings',
        processed: 0,
        total: 0,
      });
    }

    // Generate embeddings for each entry
    let processed = 0;
    const errors: string[] = [];

    for (const entry of entries) {
      try {
        await storeEntryEmbedding(
          entry.id,
          user.id,
          `${entry.title}. ${entry.content}`
        );
        processed++;
      } catch (error) {
        errors.push(`Entry ${entry.id}: ${error}`);
      }
    }

    return NextResponse.json({
      message: `Backfill complete: ${processed}/${entries.length} entries embedded`,
      processed,
      total: entries.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('POST /api/entries/backfill-embeddings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
