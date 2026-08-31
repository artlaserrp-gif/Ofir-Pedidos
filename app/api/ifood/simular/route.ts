import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { enfileirarImpressao } from '@/lib/filaImpressao';

// Este endpoint simula a chegada de um pedido do iFood, com os mesmos
// campos que a integração real vai preencher. Quando a homologação
// estiver aprovada, o polling real (app/api/ifood/polling) assume esse
// papel e este simulador pode ser removido ou mantido só para demo.

const PRODUTOS_TESTE = [
  { nome_produto: 'Combo Smash Duplo', preco_unitario: 32.9 },
  { nome_produto: 'Batata Frita G', preco_unitario: 18.0 },
  { nome_produto: 'Refrigerante Lata', preco_unitario: 7.0 }
];

export async function POST(req: NextRequest) {
  const lojaId = req.cookies.get('ofir_loja_id')?.value;
  if (!lojaId) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 });

  const db = supabaseAdmin();

  const { data: loja } = await db
    .from('lojas')
    .select('aceitar_pedidos_automaticamente')
    .eq('id', lojaId)
    .maybeSingle();

  // Se a loja aceita automaticamente, o pedido já nasce "recebido"
  // (equivalente a já ter chamado /orders/{id}/confirm na API real).
  // Se não, nasce "pendente_aceite" e espera um toque manual.
  const statusInicial = loja?.aceitar_pedidos_automaticamente === false ? 'pendente_aceite' : 'recebido';

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

  const itensEscolhidos = PRODUTOS_TESTE.slice(0, 1 + Math.floor(Math.random() * PRODUTOS_TESTE.length));
  const valor_itens = itensEscolhidos.reduce((s, i) => s + i.preco_unitario, 0);
  const valor_entrega = 6.5;

  const { data: pedido, error } = await db
    .from('pedidos')
    .insert({
      loja_id: lojaId,
      origem: 'ifood',
      ifood_order_id: 'SIMULADO-' + Date.now(),
      numero_pedido: String(numero),
      cliente_nome: 'Cliente iFood (simulado)',
      tipo_entrega: 'entrega',
      endereco_entrega: 'Rua de Teste, 123 - Bairro Exemplo',
      forma_pagamento: 'Pago no app',
      valor_itens,
      valor_entrega,
      valor_total: valor_itens + valor_entrega,
      status: statusInicial
    })
    .select()
    .single();

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  await db.from('pedido_itens').insert(
    itensEscolhidos.map((i) => ({
      pedido_id: pedido.id,
      nome_produto: i.nome_produto,
      quantidade: 1,
      preco_unitario: i.preco_unitario
    }))
  );

  if (statusInicial === 'recebido') {
    await enfileirarImpressao(db, lojaId, pedido.id);
  }

  return NextResponse.json({ ok: true, pedido });
}
