import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Este endpoint é chamado pelo Vercel Cron a cada 1 minuto (vercel.json).
// A exigência do iFood é fazer polling a cada 30s enquanto o app está
// homologado com esse método — em produção real, considerar trocar para
// webhook (mais eficiente) assim que a homologação permitir.
//
// PARA ATIVAR DE VERDADE (depois da homologação):
// 1. Preencher ifood_client_id / ifood_client_secret / ifood_merchant_id
//    na tabela `lojas` para cada loja conectada.
// 2. Implementar aqui: POST /authentication/v1.0/oauth/token (client_credentials)
//    para obter o access_token, salvar em ifood_access_token + expiry.
// 3. GET /order/v1.0/events:polling com o Bearer token, para cada loja.
// 4. Para cada evento novo do tipo PLACED, buscar detalhes em
//    GET /order/v1.0/orders/{id} e inserir em `pedidos` + `pedido_itens`,
//    igual ao endpoint /simular.
// 5. ACEITE AUTOMÁTICO: checar `loja.aceitar_pedidos_automaticamente`.
//    - Se true: chamar imediatamente POST /order/v1.0/orders/{id}/confirm
//      (o iFood dá 202 Accepted na hora, a confirmação de fato chega no
//      próximo polling como evento CONFIRMED) e já inserir o pedido com
//      status 'recebido'.
//    - Se false: inserir o pedido com status 'pendente_aceite' e esperar
//      o toque manual em /api/pedidos/{id}/aceitar, que deve então
//      chamar o mesmo endpoint de confirm.
//    IMPORTANTE: o iFood cancela automaticamente pedidos não confirmados
//    em até 8 minutos — por isso o aceite automático existe e é recomendado
//    para lojas com bom controle de estoque.
// 6. Confirmar recebimento do evento em POST /order/v1.0/events/acknowledgment.

export async function GET() {
  const db = supabaseAdmin();

  const { data: lojasConectadas } = await db
    .from('lojas')
    .select('id, ifood_conectado, aceitar_pedidos_automaticamente')
    .eq('ifood_conectado', true);

  // Ainda não há lojas com credenciais reais — só confirma que o cron está vivo.
  return NextResponse.json({
    ok: true,
    lojas_conectadas: lojasConectadas?.length || 0,
    mensagem: 'Polling real ainda não implementado — aguardando credenciais pós-homologação.'
  });
}
