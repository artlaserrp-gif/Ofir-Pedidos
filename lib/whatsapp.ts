// Envia notificações de status de pedido via WhatsApp Cloud API (Meta).
// Cada loja usa o próprio número comercial do WhatsApp (credenciais dela,
// salvas em `lojas.whatsapp_phone_number_id` e `lojas.whatsapp_access_token`).
//
// IMPORTANTE: mensagens iniciadas pela loja (fora de uma janela de 24h de
// conversa) exigem um "template" pré-aprovado pela Meta. Os nomes de
// template usados aqui (coluna `nomeTemplate`) precisam existir, aprovados,
// no WhatsApp Manager da loja, com exatamente essas variáveis. Veja o
// LEIA-ME para o texto sugerido de cada template.

type Loja = {
  whatsapp_phone_number_id?: string | null;
  whatsapp_access_token?: string | null;
  whatsapp_notificacoes_ativas?: boolean | null;
  nome?: string;
};

const TEMPLATE_POR_STATUS: Record<string, string> = {
  recebido: 'ofir_pedido_recebido',
  preparo: 'ofir_pedido_preparo',
  pronto: 'ofir_pedido_pronto',
  saiu_entrega: 'ofir_pedido_saiu_entrega',
  concluido: 'ofir_pedido_concluido',
  cancelado: 'ofir_pedido_cancelado'
};

function formatarTelefoneE164(telefone: string): string | null {
  const digitos = telefone.replace(/\D/g, '');
  if (digitos.length < 10) return null;
  // já vem com 55 (código do Brasil)?
  if (digitos.startsWith('55') && digitos.length >= 12) return digitos;
  return '55' + digitos;
}

export async function enviarStatusPedidoWhatsapp(params: {
  loja: Loja;
  telefoneCliente: string | null | undefined;
  numeroPedido: string;
  status: string;
}) {
  const { loja, telefoneCliente, numeroPedido, status } = params;

  if (!loja.whatsapp_notificacoes_ativas) return { enviado: false, motivo: 'desativado' };
  if (!loja.whatsapp_phone_number_id || !loja.whatsapp_access_token) {
    return { enviado: false, motivo: 'sem_credenciais' };
  }
  if (!telefoneCliente) return { enviado: false, motivo: 'sem_telefone' };

  const nomeTemplate = TEMPLATE_POR_STATUS[status];
  if (!nomeTemplate) return { enviado: false, motivo: 'status_sem_template' };

  const telefoneFormatado = formatarTelefoneE164(telefoneCliente);
  if (!telefoneFormatado) return { enviado: false, motivo: 'telefone_invalido' };

  try {
    const resposta = await fetch(
      `https://graph.facebook.com/v20.0/${loja.whatsapp_phone_number_id}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${loja.whatsapp_access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: telefoneFormatado,
          type: 'template',
          template: {
            name: nomeTemplate,
            language: { code: 'pt_BR' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: numeroPedido },
                  { type: 'text', text: loja.nome || 'Loja' }
                ]
              }
            ]
          }
        })
      }
    );

    if (!resposta.ok) {
      const erro = await resposta.text();
      return { enviado: false, motivo: 'erro_api', detalhe: erro };
    }
    return { enviado: true };
  } catch (e: any) {
    return { enviado: false, motivo: 'erro_rede', detalhe: e.message };
  }
}
