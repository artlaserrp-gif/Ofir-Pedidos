import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const ORIGEM_LABEL: Record<string, string> = {
  ifood: 'iFOOD',
  balcao: 'BALCÃO',
  delivery_proprio: 'ENTREGA PRÓPRIA'
};

// Consultada pelo agente local (programinha na loja), autenticada por um
// token próprio da loja — não usa o cookie de login do painel, porque o
// agente roda sozinho, sem ninguém logado no navegador.
export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '').trim();
  if (!token) return NextResponse.json({ erro: 'Token ausente.' }, { status: 401 });

  const db = supabaseAdmin();
  const { data: loja } = await db
    .from('lojas')
    .select('id, nome, largura_papel_impressao')
    .eq('impressao_api_token', token)
    .maybeSingle();

  if (!loja) return NextResponse.json({ erro: 'Token inválido.' }, { status: 401 });

  // Expira (sem imprimir) tickets muito antigos que ficaram acumulados
  // por queda de internet/energia — evita uma "rajada" de papel de
  // pedidos que já passaram da hora.
  const duasHorasAtras = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  await db
    .from('fila_impressao')
    .update({ status: 'expirado' })
    .eq('loja_id', loja.id)
    .eq('status', 'pendente')
    .lt('criado_em', duasHorasAtras);

  const { data: jobs, error } = await db
    .from('fila_impressao')
    .select('id, pedido_id, criado_em, pedidos(numero_pedido, origem, cliente_nome, cliente_telefone, tipo_entrega, endereco_entrega, forma_pagamento, observacoes, valor_itens, valor_entrega, valor_total, status, pedido_itens(*))')
    .eq('loja_id', loja.id)
    .eq('status', 'pendente')
    .order('criado_em', { ascending: true })
    .limit(20);

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  // não manda imprimir ticket de pedido que já foi cancelado nesse meio tempo
  const jobsValidos = (jobs || []).filter((j: any) => j.pedidos && j.pedidos.status !== 'cancelado');

  const tickets = jobsValidos.map((j: any) => ({
    job_id: j.id,
    loja_nome: loja.nome,
    largura_papel: loja.largura_papel_impressao || '80mm',
    numero_pedido: j.pedidos.numero_pedido,
    origem: ORIGEM_LABEL[j.pedidos.origem] || j.pedidos.origem,
    cliente_nome: j.pedidos.cliente_nome,
    cliente_telefone: j.pedidos.cliente_telefone,
    tipo_entrega: j.pedidos.tipo_entrega,
    endereco_entrega: j.pedidos.endereco_entrega,
    forma_pagamento: j.pedidos.forma_pagamento,
    observacoes: j.pedidos.observacoes,
    valor_itens: j.pedidos.valor_itens,
    valor_entrega: j.pedidos.valor_entrega,
    valor_total: j.pedidos.valor_total,
    itens: j.pedidos.pedido_itens
  }));

  return NextResponse.json({ tickets });
}
