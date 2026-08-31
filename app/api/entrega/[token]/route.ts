import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const db = supabaseAdmin();

  const { data: pedido, error } = await db
    .from('pedidos')
    .select('id, numero_pedido, cliente_nome, endereco_entrega, status, entregador_id, loja_id')
    .eq('rastreio_token', params.token)
    .maybeSingle();

  if (error || !pedido) {
    return NextResponse.json({ erro: 'Link de entrega inválido ou expirado.' }, { status: 404 });
  }

  const { data: entregador } = await db
    .from('entregadores')
    .select('nome')
    .eq('id', pedido.entregador_id)
    .maybeSingle();

  const { data: loja } = await db.from('lojas').select('nome').eq('id', pedido.loja_id).maybeSingle();

  return NextResponse.json({
    numero_pedido: pedido.numero_pedido,
    endereco_entrega: pedido.endereco_entrega,
    status: pedido.status,
    entregador_nome: entregador?.nome || 'Entregador',
    loja_nome: loja?.nome || 'Loja',
    ativo: pedido.status === 'saiu_entrega'
  });
}
