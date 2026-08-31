import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { enviarStatusPedidoWhatsapp } from '@/lib/whatsapp';
import { enfileirarImpressao } from '@/lib/filaImpressao';

export async function GET(req: NextRequest) {
  const lojaId = req.cookies.get('ofir_loja_id')?.value;
  if (!lojaId) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 });

  const db = supabaseAdmin();
  const { data, error } = await db
    .from('pedidos')
    .select('*, entregador_id, rastreio_token, pedido_itens(*)')
    .eq('loja_id', lojaId)
    .neq('status', 'concluido')
    .neq('status', 'cancelado')
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ pedidos: data });
}
export async function POST(req: NextRequest) {
  const lojaId = req.cookies.get('ofir_loja_id')?.value;
  if (!lojaId) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 });

  const body = await req.json();
  const { cliente_nome, cliente_telefone, tipo_entrega, endereco_entrega, forma_pagamento, observacoes, itens, origem } = body;

  if (!itens || itens.length === 0) {
    return NextResponse.json({ erro: 'Pedido precisa de ao menos um item.' }, { status: 400 });
  }

  const db = supabaseAdmin();

  // gera número sequencial da loja
  const { data: contador } = await db
    .from('loja_contadores')
    .select('proximo_numero')
    .eq('loja_id', lojaId)
    .maybeSingle();

  const numero = contador?.proximo_numero || 1;

  if (contador) {
    await db.from('loja_contadores').update({ proximo_numero: numero + 1 }).eq('loja_id', lojaId);
  } else {
    await db.from('loja_contadores').insert({ loja_id: lojaId, proximo_numero: numero + 1 });
  }

  const valor_itens = itens.reduce((soma: number, i: any) => soma + i.preco_unitario * i.quantidade, 0);
  const valor_entrega = body.valor_entrega || 0;

  const { data: pedido, error } = await db
    .from('pedidos')
    .insert({
      loja_id: lojaId,
      origem: origem || 'balcao',
      numero_pedido: String(numero),
      cliente_nome,
      cliente_telefone,
      tipo_entrega: tipo_entrega || 'retirada',
      endereco_entrega,
      forma_pagamento,
      observacoes,
      valor_itens,
      valor_entrega,
      valor_total: valor_itens + valor_entrega,
      status: 'recebido'
    })
    .select()
    .single();

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  const itensParaInserir = itens.map((i: any) => ({
    pedido_id: pedido.id,
    produto_id: i.produto_id || null,
    nome_produto: i.nome_produto,
    quantidade: i.quantidade,
    preco_unitario: i.preco_unitario,
    observacoes: i.observacoes || null
  }));

  await db.from('pedido_itens').insert(itensParaInserir);

  await enfileirarImpressao(db, lojaId, pedido.id);

  if (cliente_telefone) {
    const { data: loja } = await db
      .from('lojas')
      .select('nome, whatsapp_phone_number_id, whatsapp_access_token, whatsapp_notificacoes_ativas')
      .eq('id', lojaId)
      .maybeSingle();
    if (loja) {
      enviarStatusPedidoWhatsapp({
        loja,
        telefoneCliente: cliente_telefone,
        numeroPedido: pedido.numero_pedido,
        status: 'recebido'
      }).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true, pedido });
}
