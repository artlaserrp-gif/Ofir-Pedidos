import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const lojaId = req.cookies.get('ofir_loja_id')?.value;
  if (!lojaId) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 });

  const db = supabaseAdmin();
  const { data: pedido } = await db.from('pedidos').select('id').eq('id', params.id).eq('loja_id', lojaId).maybeSingle();
  if (!pedido) return NextResponse.json({ erro: 'Pedido não encontrado.' }, { status: 404 });

  const { error } = await db.from('fila_impressao').insert({ loja_id: lojaId, pedido_id: pedido.id, status: 'pendente' });
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
