// Drop-in replacement for the original Base44 SDK client.
// Surface is identical: base44.entities.X, base44.auth.X, base44.functions.invoke,
// base44.integrations.Core.UploadFile — but everything routes to Supabase.
import * as entities from '@/lib/db';
import { auth } from '@/lib/auth';
import { functions } from '@/lib/functions';
import { integrations } from '@/lib/storage';

export const base44 = {
  entities,
  auth,
  functions,
  integrations,
};
