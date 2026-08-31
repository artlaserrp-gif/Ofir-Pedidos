import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '').trim();
  if (!token) return NextResponse.json({ erro: 'Token ausente.' }, { status: 401 });

  const { job_id, sucesso, erro } = await req.json();

  const db = supabaseAdmin();
  const { data: loja } = await db.from('lojas').select('id').eq('impressao_api_token', token).maybeSingle();
  if (!loja) return NextResponse.json({ erro: 'Token inválido.' }, { status: 401 });

  if (sucesso) {
    await db
      .from('fila_impressao')
      .update({ status: 'impresso', impresso_em: new Date().toISOString() })
      .eq('id', job_id)
      .eq('loja_id', loja.id);
  } else {
    // incrementa tentativa; depois de 5 falhas, desiste e marca como erro definitivo
    const { data: job } = await db
      .from('fila_impressao')
      .select('tentativas')
      .eq('id', job_id)
      .eq('loja_id', loja.id)
      .maybeSingle();

    const tentativas = (job?.tentativas || 0) + 1;
    await db
      .from('fila_impressao')
      .update({
        tentativas,
        erro_mensagem: erro || 'Falha desconhecida',
        status: tentativas >= 5 ? 'erro' : 'pendente'
      })
      .eq('id', job_id)
      .eq('loja_id', loja.id);
  }

  return NextResponse.json({ ok: true });
}
