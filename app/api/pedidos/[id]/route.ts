import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { enviarStatusPedidoWhatsapp } from '@/lib/whatsapp';

const STATUS_VALIDOS = ['recebido', 'preparo', 'pronto', 'saiu_entrega', 'concluido', 'cancelado'];

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const lojaId = req.cookies.get('ofir_loja_id')?.value;
  if (!lojaId) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 });

  const db = supabaseAdmin();
  const { data, error } = await db
    .from('pedidos')
    .select('*, pedido_itens(*)')
    .eq('id', params.id)
    .eq('loja_id', lojaId)
    .maybeSingle();

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ erro: 'Pedido não encontrado.' }, { status: 404 });
  return NextResponse.json({ pedido: data });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const lojaId = req.cookies.get('ofir_loja_id')?.value;
  if (!lojaId) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 });

  const { status, entregador_id } = await req.json();
  if (!STATUS_VALIDOS.includes(status)) {
    return NextResponse.json({ erro: 'Status inválido.' }, { status: 400 });
  }

  const db = supabaseAdmin();

  const atualizacao: Record<string, unknown> = { status, updated_at: new Date().toISOString() };

  // Se está sendo despachado com um entregador escolhido, gera o link de rastreio.
  // Se não escolher entregador (pedido concluído pelo dono, motoboy avulso etc.),
  // segue normal sem rastreio nenhum — nada trava.
  if (status === 'saiu_entrega' && entregador_id) {
    atualizacao.entregador_id = entregador_id;
    atualizacao.rastreio_token = randomUUID();
  }

  const { data, error } = await db
    .from('pedidos')
    .update(atualizacao)
    .eq('id', params.id)
    .eq('loja_id', lojaId)
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ erro: 'Pedido não encontrado.' }, { status: 404 });

  // TODO: quando a integração real do iFood estiver ativa, refletir a
  // mudança de status via PATCH /order/v1.0/orders/{id}/confirm|readyToPickup|dispatch

  // Notifica o cliente por WhatsApp (se a loja tiver isso configurado e o
  // pedido tiver telefone — não bloqueia a resposta se falhar).
  if (data.cliente_telefone) {
    const { data: loja } = await db
      .from('lojas')
      .select('nome, whatsapp_phone_number_id, whatsapp_access_token, whatsapp_notificacoes_ativas')
      .eq('id', lojaId)
      .maybeSingle();
    if (loja) {
      enviarStatusPedidoWhatsapp({
        loja,
        telefoneCliente: data.cliente_telefone,
        numeroPedido: data.numero_pedido,
        status
      }).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true, pedido: data });
}
