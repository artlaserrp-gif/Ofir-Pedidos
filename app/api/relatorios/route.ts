import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const ORIGEM_LABEL: Record<string, string> = {
  ifood: 'iFood',
  balcao: 'Balcão',
  delivery_proprio: 'Entrega própria',
  cliente_online: 'Pedido online'
};

export async function GET(req: NextRequest) {
  const lojaId = req.cookies.get('ofir_loja_id')?.value;
  if (!lojaId) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 });

  const periodo = req.nextUrl.searchParams.get('periodo') || '7dias';
  const dias = periodo === 'hoje' ? 1 : periodo === '30dias' ? 30 : 7;

  const desde = new Date();
  desde.setDate(desde.getDate() - dias);
  desde.setHours(0, 0, 0, 0);

  const db = supabaseAdmin();
  const { data: pedidos, error } = await db
    .from('pedidos')
    .select('id, origem, status, valor_total, numero_pedido, cliente_nome, created_at')
    .eq('loja_id', lojaId)
    .gte('created_at', desde.toISOString())
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  const concluidos = (pedidos || []).filter((p) => p.status === 'concluido');
  const cancelados = (pedidos || []).filter((p) => p.status === 'cancelado');

  const faturamento = concluidos.reduce((s, p) => s + Number(p.valor_total || 0), 0);
  const ticketMedio = concluidos.length ? faturamento / concluidos.length : 0;

  const porOrigemMap: Record<string, { quantidade: number; valor: number }> = {};
  for (const p of concluidos) {
    const chave = p.origem || 'balcao';
    porOrigemMap[chave] = porOrigemMap[chave] || { quantidade: 0, valor: 0 };
    porOrigemMap[chave].quantidade += 1;
    porOrigemMap[chave].valor += Number(p.valor_total || 0);
  }
  const porOrigem = Object.entries(porOrigemMap).map(([origem, dados]) => ({
    origem,
    label: ORIGEM_LABEL[origem] || origem,
    ...dados
  }));

  return NextResponse.json({
    periodo,
    totalPedidos: concluidos.length,
    faturamento,
    ticketMedio,
    cancelados: cancelados.length,
    porOrigem,
    pedidosRecentes: (pedidos || []).slice(0, 20)
  });
}
