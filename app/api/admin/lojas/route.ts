import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

function autorizado(req: NextRequest) {
  const cookie = req.cookies.get('ofir_admin')?.value;
  return !!cookie && cookie === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 });

  const db = supabaseAdmin();
  const { data, error } = await db
    .from('lojas')
    .select('id, nome, cnpj, telefone, plano, ativo, trial_expira_em, bloqueado_motivo, created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ lojas: data });
}
