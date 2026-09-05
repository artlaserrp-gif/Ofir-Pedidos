import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { enviarStatusPedidoWhatsapp } from '@/lib/whatsapp';
import { enfileirarImpressao } from '@/lib/filaImpressao';

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const body = await req.json();
  const { cliente_nome, cliente_telefone, tipo_entrega, endereco_entrega, forma_pagamento, observacoes, itens } = body;

  if (!cliente_nome?.trim() || !cliente_telefone?.trim()) {
    return NextResponse.json({ erro: 'Nome e telefone são obrigatórios.' }, { status: 400 });
  }
  if (!itens || itens.length === 0) {
    return NextResponse.json({ erro: 'O pedido precisa de ao menos um item.' }, { status: 400 });
  }
  if (tipo_entrega === 'entrega' && !endereco_entrega?.trim()) {
    return NextResponse.json({ erro: 'Informe o endereço de entrega.' }, { status: 400 });
  }

  const db = supabaseAdmin();

  const { data: loja } = await db
    .from('lojas')
    .select('id, nome, ativo, plano, trial_expira_em, aberto_manual, whatsapp_phone_number_id, whatsapp_access_token, whatsapp_notificacoes_ativas')
    .eq('slug', params.slug)
    .maybeSingle();

  if (!loja) return NextResponse.json({ erro: 'Loja não encontrada.' }, { status: 404 });

  const trialVencido = loja.plano === 'trial' && loja.trial_expira_em && new Date(loja.trial_expira_em) < new Date();
  if (!loja.ativo || trialVencido) {
    return NextResponse.json({ erro: 'Essa loja não está aceitando pedidos no momento.' }, { status: 403 });
  }
  if (loja.aberto_manual === false) {
    return NextResponse.json({ erro: 'A loja fechou temporariamente enquanto você montava o pedido. Tente mais tarde.' }, { status: 423 });
  }

  // recalcula preço no servidor a partir do cardápio real — nunca confia no preço mandado pelo navegador
  const idsProdutos = itens.map((i: any) => i.produto_id).filter(Boolean);
  const { data: produtosReais } = await db
    .from('produtos')
    .select('id, nome, preco')
    .in('id', idsProdutos)
    .eq('loja_id', loja.id)
    .eq('ativo', true);

  const mapaProdutos = new Map((produtosReais || []).map((p) => [p.id, p]));
  const itensValidados = itens
    .map((i: any) => {
      const real = mapaProdutos.get(i.produto_id);
      if (!real) return null;
      return {
        produto_id: real.id,
        nome_produto: real.nome,
        quantidade: Math.max(1, Number(i.quantidade) || 1),
        preco_unitario: real.preco
      };
    })
    .filter(Boolean) as { produto_id: string; nome_produto: string; quantidade: number; preco_unitario: number }[];

  if (itensValidados.length === 0) {
    return NextResponse.json({ erro: 'Os itens do pedido não são mais válidos. Atualize a página.' }, { status: 400 });
  }

  const { data: contador } = await db.from('loja_contadores').select('proximo_numero').eq('loja_id', loja.id).maybeSingle();
  const numero = contador?.proximo_numero || 1;
  if (contador) {
    await db.from('loja_contadores').update({ proximo_numero: numero + 1 }).eq('loja_id', loja.id);
  } else {
    await db.from('loja_contadores').insert({ loja_id: loja.id, proximo_numero: numero + 1 });
  }

  const valor_itens = itensValidados.reduce((s, i) => s + i.preco_unitario * i.quantidade, 0);

  const { data: pedido, error } = await db
    .from('pedidos')
    .insert({
      loja_id: loja.id,
      origem: 'cliente_online',
      numero_pedido: String(numero),
      cliente_nome: cliente_nome.trim(),
      cliente_telefone: cliente_telefone.trim(),
      tipo_entrega: tipo_entrega === 'entrega' ? 'entrega' : 'retirada',
      endereco_entrega: tipo_entrega === 'entrega' ? endereco_entrega.trim() : null,
      forma_pagamento: forma_pagamento || null,
      observacoes: observacoes || null,
      valor_itens,
      valor_entrega: 0,
      valor_total: valor_itens,
      status: 'recebido'
    })
    .select()
    .single();

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  await db.from('pedido_itens').insert(
    itensValidados.map((i) => ({
      pedido_id: pedido.id,
      produto_id: i.produto_id,
      nome_produto: i.nome_produto,
      quantidade: i.quantidade,
      preco_unitario: i.preco_unitario
    }))
  );

  await enfileirarImpressao(db, loja.id, pedido.id);
  enviarStatusPedidoWhatsapp({
    loja,
    telefoneCliente: cliente_telefone,
    numeroPedido: pedido.numero_pedido,
    status: 'recebido'
  }).catch(() => {});

  return NextResponse.json({ ok: true, numero_pedido: pedido.numero_pedido });
}
