import { createClient } from '@supabase/supabase-js';

// Usa a service role key — nunca exposta ao navegador.
// Todo acesso ao banco passa pelas API routes (app/api/**).
export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false } }
  );
}
