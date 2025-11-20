import { inferAsyncReturnType } from '@trpc/server';
import type { CreateNextContextOptions } from '@trpc/server/adapters/next';
import { db } from '../../db';
import { getSession } from 'better-auth/next';

export async function createContext(opts: CreateNextContextOptions) {
  const session = await getSession(opts.req, opts.res);

  return {
    db,
    session,
    req: opts.req,
    res: opts.res,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;