import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const db = supabaseAdmin();

  const { data: loja } = await db
    .from('lojas')
    .select('id, nome, logo_url, cor_tema, ativo, plano, trial_expira_em, aberto_manual, tempo_estimado_balcao, tempo_estimado_entrega')
    .eq('slug', params.slug)
    .maybeSingle();

  if (!loja) return NextResponse.json({ erro: 'Loja não encontrada.' }, { status: 404 });

  const trialVencido = loja.plano === 'trial' && loja.trial_expira_em && new Date(loja.trial_expira_em) < new Date();
  if (!loja.ativo || trialVencido) {
    return NextResponse.json({ erro: 'Essa loja não está aceitando pedidos no momento.' }, { status: 403 });
  }
  if (loja.aberto_manual === false) {
    return NextResponse.json({ erro: 'A loja está fechada temporariamente. Volte mais tarde!' }, { status: 423 });
  }

  const { data: produtos } = await db
    .from('produtos')
    .select('id, nome, categoria, descricao, preco, imagem_url')
    .eq('loja_id', loja.id)
    .eq('ativo', true)
    .order('categoria')
    .order('nome');

  return NextResponse.json({
    loja: {
      nome: loja.nome,
      logo_url: loja.logo_url,
      cor_tema: loja.cor_tema || '#F0B94F',
      tempo_estimado_balcao: loja.tempo_estimado_balcao,
      tempo_estimado_entrega: loja.tempo_estimado_entrega
    },
    produtos: produtos || []
  });
}
