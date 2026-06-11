// Purpose: protect API routes by verifying the Bearer token with Supabase.
// This file reads the request auth header, checks the token, and then finds or
// creates the matching user in Prisma so backend routes can trust the caller.

import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  // Reuse one admin client instead of creating a new one on every request.
  if (!supabaseAdmin) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    supabaseAdmin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return supabaseAdmin;
}

/**
 * Authenticate a request by extracting the Bearer token and validating with Supabase.
 * Finds or creates the user in the database.
 * Returns the authenticated user or throws an error.
 */
export async function getAuthUser(request: Request): Promise<AuthUser> {
  // Read the auth header that should contain: Authorization: Bearer <token>.
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    throw new AuthError('No authorization header');
  }

  // Split the header into its type and token value.
  const [type, token] = authHeader.split(' ');
  if (type !== 'Bearer' || !token) {
    throw new AuthError('Invalid authorization format');
  }

  // Ask Supabase whether the token is valid and belongs to a real user.
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user?.id) {
    throw new AuthError('Invalid or expired token');
  }

  const supabaseUser = data.user;

  // Sync the Supabase user with the local Prisma user table.
  let user = await prisma.user.findUnique({ where: { id: supabaseUser.id } });

  const metadataName = supabaseUser.user_metadata?.display_name || supabaseUser.user_metadata?.full_name || null;
  const metadataAvatar = supabaseUser.user_metadata?.avatar_url || null;

  if (!user) {
    // Some auth providers may not give an email, so create a safe fallback value.
    user = await prisma.user.create({
      data: {
        id: supabaseUser.id,
        email: supabaseUser.email || `${supabaseUser.id}@no-email.invalid`,
        name: metadataName,
        avatarUrl: metadataAvatar,
      },
    });
  } else {
    // Keep user's name and avatar in sync with Supabase Auth metadata.
    if (
      (metadataName && user.name !== metadataName) ||
      (metadataAvatar && user.avatarUrl !== metadataAvatar)
    ) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: metadataName,
          avatarUrl: metadataAvatar,
        },
      });
    }
  }

  return { id: user.id, email: user.email, name: user.name || undefined };
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}
