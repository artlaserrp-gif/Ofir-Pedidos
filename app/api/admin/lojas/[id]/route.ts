import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

function autorizado(req: NextRequest) {
  const cookie = req.cookies.get('ofir_admin')?.value;
  return !!cookie && cookie === process.env.ADMIN_PASSWORD;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!autorizado(req)) return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 });

  const body = await req.json();
  const atualizacao: Record<string, unknown> = {};

  if (typeof body.ativo === 'boolean') atualizacao.ativo = body.ativo;
  if (typeof body.bloqueado_motivo === 'string') atualizacao.bloqueado_motivo = body.bloqueado_motivo;
  if (body.plano === 'trial' || body.plano === 'pago') atualizacao.plano = body.plano;
  if (body.estenderTrialDias) {
    const db0 = supabaseAdmin();
    const { data: atual } = await db0.from('lojas').select('trial_expira_em').eq('id', params.id).maybeSingle();
    const base = atual?.trial_expira_em ? new Date(atual.trial_expira_em) : new Date();
    const novaData = base > new Date() ? base : new Date();
    novaData.setDate(novaData.getDate() + Number(body.estenderTrialDias));
    atualizacao.trial_expira_em = novaData.toISOString();
  }

  const db = supabaseAdmin();
  const { data, error } = await db.from('lojas').update(atualizacao).eq('id', params.id).select().maybeSingle();

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, loja: data });
}
