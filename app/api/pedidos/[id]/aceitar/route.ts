import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { enviarStatusPedidoWhatsapp } from '@/lib/whatsapp';
import { enfileirarImpressao } from '@/lib/filaImpressao';

// Aceita manualmente um pedido que está em 'pendente_aceite'.
// Quando a integração real do iFood estiver ativa, este é o ponto onde
// deve entrar a chamada POST /order/v1.0/orders/{id}/confirm antes de
// mudar o status aqui — o iFood dá até 8 minutos para essa confirmação.

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const lojaId = req.cookies.get('ofir_loja_id')?.value;
  if (!lojaId) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 });

  const db = supabaseAdmin();

  const { data, error } = await db
    .from('pedidos')
    .update({ status: 'recebido', updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('loja_id', lojaId)
    .eq('status', 'pendente_aceite')
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ erro: 'Pedido não encontrado ou já aceito.' }, { status: 404 });

  await enfileirarImpressao(db, lojaId, data.id);

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
        status: 'recebido'
      }).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true, pedido: data });
}
