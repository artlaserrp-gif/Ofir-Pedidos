import { SupabaseClient } from '@supabase/supabase-js';

// Adiciona um pedido na fila de impressão automática (pro agente local
// buscar e imprimir). Não faz nada se a loja não tiver a impressão
// automática ativada — assim não enche a fila à toa.
export async function enfileirarImpressao(db: SupabaseClient, lojaId: string, pedidoId: string) {
  const { data: loja } = await db
    .from('lojas')
    .select('impressao_automatica_ativa')
    .eq('id', lojaId)
    .maybeSingle();

  if (!loja?.impressao_automatica_ativa) return;

  await db.from('fila_impressao').insert({ loja_id: lojaId, pedido_id: pedidoId, status: 'pendente' });
}
