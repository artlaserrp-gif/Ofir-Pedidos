import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { cnpj, pin } = await req.json();

  if (!cnpj || !pin) {
    return NextResponse.json({ erro: 'Informe CNPJ e PIN.' }, { status: 400 });
  }

  const cnpjLimpo = cnpj.replace(/\D/g, '');
  const db = supabaseAdmin();

  const { data: loja, error } = await db
    .from('lojas')
    .select('id, nome, pin, ativo, logo_url, cor_tema, ifood_conectado, plano, trial_expira_em, bloqueado_motivo')
    .eq('cnpj', cnpjLimpo)
    .maybeSingle();

  if (error || !loja) {
    return NextResponse.json({ erro: 'Loja não encontrada.' }, { status: 404 });
  }
  if (loja.pin !== pin) {
    return NextResponse.json({ erro: 'PIN incorreto.' }, { status: 401 });
  }
  if (!loja.ativo) {
    return NextResponse.json(
      { erro: loja.bloqueado_motivo || 'Conta bloqueada. Fale com o suporte para regularizar.' },
      { status: 403 }
    );
  }
  if (loja.plano === 'trial' && loja.trial_expira_em && new Date(loja.trial_expira_em) < new Date()) {
    return NextResponse.json(
      { erro: 'Seu período de teste grátis acabou. Fale com o suporte para assinar e continuar usando.' },
      { status: 403 }
    );
  }

  const res = NextResponse.json({
    ok: true,
    loja: { id: loja.id, nome: loja.nome, logo_url: loja.logo_url, cor_tema: loja.cor_tema, ifood_conectado: loja.ifood_conectado }
  });

  res.cookies.set('ofir_loja_id', loja.id, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30 // 30 dias
  });

  return res;
}
