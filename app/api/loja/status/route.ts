import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const lojaId = req.cookies.get('ofir_loja_id')?.value;
  if (!lojaId) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 });

  const db = supabaseAdmin();
  const { data: loja, error } = await db
    .from('lojas')
    .select('nome, ativo, plano, trial_expira_em, bloqueado_motivo')
    .eq('id', lojaId)
    .maybeSingle();

  if (error || !loja) return NextResponse.json({ erro: 'Loja não encontrada.' }, { status: 404 });

  const trialVencido =
    loja.plano === 'trial' && loja.trial_expira_em && new Date(loja.trial_expira_em) < new Date();

  const bloqueado = !loja.ativo || trialVencido;

  let diasRestantesTrial: number | null = null;
  if (loja.plano === 'trial' && loja.trial_expira_em) {
    const diff = new Date(loja.trial_expira_em).getTime() - Date.now();
    diasRestantesTrial = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  return NextResponse.json({
    bloqueado,
    motivo: !loja.ativo
      ? loja.bloqueado_motivo || 'Conta bloqueada. Fale com o suporte.'
      : trialVencido
      ? 'Seu período de teste grátis acabou.'
      : null,
    plano: loja.plano,
    diasRestantesTrial
  });
}
