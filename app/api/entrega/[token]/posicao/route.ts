import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const { lat, lng } = await req.json();
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return NextResponse.json({ erro: 'Coordenadas inválidas.' }, { status: 400 });
  }

  const db = supabaseAdmin();

  const { data: pedido } = await db
    .from('pedidos')
    .select('entregador_id, status')
    .eq('rastreio_token', params.token)
    .maybeSingle();

  if (!pedido || !pedido.entregador_id) {
    return NextResponse.json({ erro: 'Link de entrega inválido.' }, { status: 404 });
  }

  await db
    .from('posicoes_entregador')
    .upsert({ entregador_id: pedido.entregador_id, lat, lng, atualizado_em: new Date().toISOString() });

  return NextResponse.json({ ok: true, status_pedido: pedido.status });
}
