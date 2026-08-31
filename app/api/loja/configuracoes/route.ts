import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const lojaId = req.cookies.get('ofir_loja_id')?.value;
  if (!lojaId) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 });

  const db = supabaseAdmin();
  const { data, error } = await db
    .from('lojas')
    .select(
      'nome, slug, logo_url, cor_tema, aceitar_pedidos_automaticamente, ifood_conectado, whatsapp_phone_number_id, whatsapp_access_token, whatsapp_notificacoes_ativas, largura_papel_impressao, impressao_api_token, impressao_automatica_ativa'
    )
    .eq('id', lojaId)
    .maybeSingle();

  if (error || !data) return NextResponse.json({ erro: 'Loja não encontrada.' }, { status: 404 });

  return NextResponse.json({
    ...data,
    whatsapp_access_token: undefined,
    impressao_api_token: undefined,
    whatsapp_token_configurado: !!data.whatsapp_access_token,
    impressao_token_configurado: !!data.impressao_api_token
  });
}

export async function PATCH(req: NextRequest) {
  const lojaId = req.cookies.get('ofir_loja_id')?.value;
  if (!lojaId) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 });

  const body = await req.json();
  const atualizacao: Record<string, unknown> = {};

  if (typeof body.aceitar_pedidos_automaticamente === 'boolean') {
    atualizacao.aceitar_pedidos_automaticamente = body.aceitar_pedidos_automaticamente;
  }
  if (typeof body.whatsapp_notificacoes_ativas === 'boolean') {
    atualizacao.whatsapp_notificacoes_ativas = body.whatsapp_notificacoes_ativas;
  }
  if (typeof body.whatsapp_phone_number_id === 'string') {
    atualizacao.whatsapp_phone_number_id = body.whatsapp_phone_number_id.trim();
  }
  if (typeof body.whatsapp_access_token === 'string' && body.whatsapp_access_token.trim()) {
    atualizacao.whatsapp_access_token = body.whatsapp_access_token.trim();
  }
  if (body.largura_papel_impressao === '58mm' || body.largura_papel_impressao === '80mm') {
    atualizacao.largura_papel_impressao = body.largura_papel_impressao;
  }
  if (typeof body.impressao_automatica_ativa === 'boolean') {
    atualizacao.impressao_automatica_ativa = body.impressao_automatica_ativa;
  }
  if (typeof body.cor_tema === 'string' && /^#[0-9A-Fa-f]{6}$/.test(body.cor_tema)) {
    atualizacao.cor_tema = body.cor_tema;
  }

  const db = supabaseAdmin();
  const { error } = await db.from('lojas').update(atualizacao).eq('id', lojaId);

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
