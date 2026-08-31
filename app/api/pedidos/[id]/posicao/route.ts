import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const lojaId = req.cookies.get('ofir_loja_id')?.value;
  if (!lojaId) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 });

  const db = supabaseAdmin();

  const { data: pedido } = await db
    .from('pedidos')
    .select('entregador_id')
    .eq('id', params.id)
    .eq('loja_id', lojaId)
    .maybeSingle();

  if (!pedido || !pedido.entregador_id) {
    return NextResponse.json({ erro: 'Pedido sem entregador vinculado.' }, { status: 404 });
  }

  const { data: posicao } = await db
    .from('posicoes_entregador')
    .select('lat, lng, atualizado_em')
    .eq('entregador_id', pedido.entregador_id)
    .maybeSingle();

  return NextResponse.json({ posicao: posicao || null });
}
