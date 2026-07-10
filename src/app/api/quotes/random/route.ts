import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Mood, QuoteType } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const apiNinjasKey = process.env.API_NINJAS_KEY;
    
    if (apiNinjasKey) {
      try {
        const response = await fetch('https://api.api-ninjas.com/v1/quotes?category=inspirational', {
          headers: {
            'X-Api-Key': apiNinjasKey,
          },
          next: { revalidate: 3600 }, // cache for 1 hour
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            return NextResponse.json({
              text: data[0].quote,
              author: data[0].author,
            });
          }
        }
      } catch (err) {
        console.error('Error fetching quote from API Ninjas:', err);
        // Fall back to local DB if API Ninjas fails
      }
    }

    // Local DB Fallback
    const { searchParams } = new URL(request.url);
    const moodParam = searchParams.get('mood');
    const typeParam = searchParams.get('type');

    const where: { mood?: Mood; type?: QuoteType } = {};
    if (moodParam && Object.values(Mood).includes(moodParam as Mood)) where.mood = moodParam as Mood;
    if (typeParam && Object.values(QuoteType).includes(typeParam as QuoteType)) where.type = typeParam as QuoteType;

    const count = await prisma.quote.count({ where });
    if (count === 0) {
      return NextResponse.json(null);
    }

    const skip = Math.floor(Math.random() * count);
    const quotes = await prisma.quote.findMany({ where, skip, take: 1 });

    return NextResponse.json(quotes[0] || null);
  } catch (error) {
    console.error('GET /api/quotes/random error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
