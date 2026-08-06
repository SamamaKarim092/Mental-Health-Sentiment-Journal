// RAG (Retrieval-Augmented Generation) Core Library
// ================================================
// Lightweight, zero-dependency semantic search for journal entries.
// Uses TF-IDF vectorization with cosine similarity — runs entirely in Node.js
// with no external API calls or paid subscriptions required.

import { prisma } from '@/lib/prisma';

// ─── Constants ────────────────────────────────────────────────────────────

// Vocabulary size for TF-IDF vectors. Larger = more precise but more memory.
const VOCAB_SIZE = 512;

// Common English stop words to filter out during tokenization
const STOP_WORDS = new Set([
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your',
  'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her',
  'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs',
  'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those',
  'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if',
  'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with',
  'about', 'against', 'between', 'through', 'during', 'before', 'after', 'above',
  'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under',
  'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
  'how', 'all', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
  'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's',
  't', 'can', 'will', 'just', 'don', 'should', 'now', 'd', 'll', 'm', 'o', 're',
  've', 'y', 'ain', 'aren', 'couldn', 'didn', 'doesn', 'hadn', 'hasn', 'haven',
  'isn', 'ma', 'mightn', 'mustn', 'needn', 'shan', 'shouldn', 'wasn', 'weren',
  'won', 'wouldn', 'also', 'really', 'much', 'like', 'get', 'got', 'going',
  'went', 'come', 'came', 'make', 'made', 'think', 'thought', 'know', 'knew',
  'want', 'wanted', 'thing', 'things', 'way', 'ways', 'even', 'well', 'back',
  'still', 'day', 'time', 'good', 'could', 'would',
]);

// ─── Tokenization ─────────────────────────────────────────────────────────

/**
 * Tokenizes text into meaningful words for embedding.
 * - Lowercases everything
 * - Strips punctuation and numbers
 * - Removes stop words
 * - Filters tokens shorter than 2 chars
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')        // Strip non-alpha characters
    .split(/\s+/)                      // Split on whitespace
    .filter(word => word.length >= 2 && !STOP_WORDS.has(word));
}

/**
 * Simple hash function to map a word to a bucket index.
 * Uses DJB2 hash — fast, well-distributed for English tokens.
 */
function hashWord(word: string): number {
  let hash = 5381;
  for (let i = 0; i < word.length; i++) {
    hash = ((hash << 5) + hash + word.charCodeAt(i)) & 0x7fffffff;
  }
  return hash % VOCAB_SIZE;
}

// ─── Vector Generation ────────────────────────────────────────────────────

/**
 * Generates a normalized TF-IDF-style embedding vector for text.
 *
 * How it works:
 * 1. Tokenizes the text into meaningful words
 * 2. Maps each word to a fixed bucket via hashing (hashing trick)
 * 3. Counts term frequency per bucket
 * 4. Applies sub-linear TF scaling: 1 + log(count) for smoothing
 * 5. L2-normalizes the final vector to unit length
 *
 * The result is a 512-dimensional float array that captures the semantic
 * "fingerprint" of the text. Similar texts produce similar vectors.
 */
export function generateEmbedding(text: string): number[] {
  const tokens = tokenize(text);
  const vector = new Array(VOCAB_SIZE).fill(0);

  // Count term frequency per hash bucket
  for (const token of tokens) {
    const idx = hashWord(token);
    vector[idx] += 1;
  }

  // Apply sub-linear TF: 1 + log(tf) for non-zero buckets
  for (let i = 0; i < VOCAB_SIZE; i++) {
    if (vector[i] > 0) {
      vector[i] = 1 + Math.log(vector[i]);
    }
  }

  // L2 normalize to unit vector
  const magnitude = Math.sqrt(vector.reduce((sum: number, v: number) => sum + v * v, 0));
  if (magnitude > 0) {
    for (let i = 0; i < VOCAB_SIZE; i++) {
      vector[i] = vector[i] / magnitude;
    }
  }

  return vector;
}

// ─── Similarity Scoring ───────────────────────────────────────────────────

/**
 * Calculates cosine similarity between two vectors.
 * Returns a value between 0 (completely different) and 1 (identical).
 *
 * Since our vectors are L2-normalized, cosine similarity = dot product.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }

  // Clamp to [0, 1] to handle floating point noise
  return Math.max(0, Math.min(1, dotProduct));
}

// ─── Semantic Search ──────────────────────────────────────────────────────

export interface RelevantEntry {
  entryId: string;
  title: string;
  content: string;
  moodLabels: string[];
  createdAt: Date;
  similarity: number;        // 0–1 relevance score
  similarityPercent: number;  // 0–100 for display
}

/**
 * Finds the most relevant past journal entries for a given query.
 *
 * Steps:
 * 1. Generates a query embedding from the user's chat message
 * 2. Fetches all stored embeddings for this user from the database
 * 3. Calculates cosine similarity between query and each entry embedding
 * 4. Returns the top K entries above a minimum relevance threshold
 *
 * @param userId  The authenticated user's ID
 * @param query   The user's chat message to find relevant context for
 * @param topK    Maximum number of entries to return (default: 3)
 * @returns       Array of relevant entries with similarity scores
 */
export async function findRelevantEntries(
  userId: string,
  query: string,
  topK: number = 3
): Promise<RelevantEntry[]> {
  const MIN_SIMILARITY = 0.15; // Minimum relevance threshold (15%)

  try {
    // Step 1: Generate embedding for the query
    const queryVector = generateEmbedding(query);

    // Step 2: Fetch all embeddings for this user
    const embeddings = await prisma.entryEmbedding.findMany({
      where: { userId },
      include: {
        entry: {
          select: {
            id: true,
            title: true,
            content: true,
            moodLabels: true,
            createdAt: true,
          },
        },
      },
    });

    if (embeddings.length === 0) return [];

    // Step 3: Score each entry by similarity
    const scored = embeddings
      .map(emb => ({
        entryId: emb.entry.id,
        title: emb.entry.title,
        content: emb.entry.content,
        moodLabels: emb.entry.moodLabels,
        createdAt: emb.entry.createdAt,
        similarity: cosineSimilarity(queryVector, emb.vector),
        similarityPercent: 0,
      }))
      .filter(item => item.similarity >= MIN_SIMILARITY)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    // Add percentage display values
    for (const item of scored) {
      item.similarityPercent = Math.round(item.similarity * 100);
    }

    return scored;
  } catch (error) {
    console.error('RAG findRelevantEntries error:', error);
    return [];
  }
}

/**
 * Generates and stores an embedding for a journal entry.
 * If an embedding already exists for this entry, it is updated.
 *
 * @param entryId  The journal entry ID
 * @param userId   The user who owns the entry
 * @param text     The full text to embed (title + content)
 */
export async function storeEntryEmbedding(
  entryId: string,
  userId: string,
  text: string
): Promise<void> {
  try {
    const vector = generateEmbedding(text);

    await prisma.entryEmbedding.upsert({
      where: { entryId },
      create: { entryId, userId, vector },
      update: { vector },
    });
  } catch (error) {
    console.error(`Failed to store embedding for entry ${entryId}:`, error);
  }
}

// ─── Semantic Theme Clustering for Analysis Page ──────────────────────────

export interface SemanticCluster {
  theme: string;
  description: string;
  icon: string;
  relevance: number; // 0-100%
  matchingEntriesCount: number;
}

const WELLNESS_THEMES = [
  {
    theme: "Work & Stress Management",
    description: "Career pressures, deadlines, workload, and professional focus",
    query: "work job career deadline project office stress business client busy pressure workload",
    icon: "💼",
  },
  {
    theme: "Emotional Balance & Reflection",
    description: "Inner peace, gratitude, calm reflection, and emotional processing",
    query: "peace calm happy grateful joy mood feeling emotion reflection quiet meditate relax mindfulness",
    icon: "🧘",
  },
  {
    theme: "Health, Energy & Vitality",
    description: "Physical exercise, sleep quality, energy levels, and body wellness",
    query: "workout exercise run gym sleep energy fatigue healthy food diet body rest stamina active",
    icon: "⚡",
  },
  {
    theme: "Personal Growth & Aspirations",
    description: "Long-term goals, self-improvement, learning, and productivity habits",
    query: "goal ambition growth learn study future plan success focus discipline habit achievement progress",
    icon: "🎯",
  },
  {
    theme: "Social Connection & Support",
    description: "Family, friends, community, and meaningful interpersonal relationships",
    query: "family friends partner social love conversation support talk people relationship connection team",
    icon: "❤️",
  },
];

/**
 * Computes semantic clusters across all of a user's stored vector embeddings.
 * Maps past entries to core psychological wellness themes using RAG vector similarity.
 */
export async function getSemanticClusters(userId: string): Promise<SemanticCluster[]> {
  try {
    const embeddings = await prisma.entryEmbedding.findMany({
      where: { userId },
      select: { vector: true },
    });

    if (embeddings.length === 0) return [];

    const clusters: SemanticCluster[] = [];

    for (const theme of WELLNESS_THEMES) {
      const themeVector = generateEmbedding(theme.query);
      let matchCount = 0;
      let totalSimilarity = 0;

      for (const emb of embeddings) {
        const sim = cosineSimilarity(themeVector, emb.vector);
        if (sim >= 0.12) {
          matchCount++;
          totalSimilarity += sim;
        }
      }

      if (matchCount > 0) {
        const avgSim = totalSimilarity / matchCount;
        const score = Math.min(98, Math.round(avgSim * 140 + matchCount * 8));
        clusters.push({
          theme: theme.theme,
          description: theme.description,
          icon: theme.icon,
          relevance: score,
          matchingEntriesCount: matchCount,
        });
      }
    }

    return clusters.sort((a, b) => b.relevance - a.relevance);
  } catch (error) {
    console.error("RAG getSemanticClusters error:", error);
    return [];
  }
}
