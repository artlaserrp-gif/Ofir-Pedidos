'use client';

import { formatarHoraBrasil } from '@/lib/brazilTime';
import type { Pedido } from '@/app/dashboard/page';

const ORIGEM_LABEL: Record<string, { texto: string; cor: string }> = {
  ifood: { texto: 'iFood', cor: 'bg-red-500/20 text-red-400 border-red-500/40' },
  balcao: { texto: 'Balcão', cor: 'bg-gold/20 text-gold border-gold/40' },
  delivery_proprio: { texto: 'Entrega própria', cor: 'bg-blue/20 text-blue border-blue/40' },
  cliente_online: { texto: 'Pedido online', cor: 'bg-green-500/20 text-green-400 border-green-500/40' }
};

const PROXIMO_STATUS: Record<string, { chave: string; texto: string } | null> = {
  recebido: { chave: 'preparo', texto: 'Iniciar preparo' },
  preparo: { chave: 'pronto', texto: 'Marcar pronto' },
  pronto: { chave: 'saiu_entrega', texto: 'Saiu p/ entrega' },
  saiu_entrega: { chave: 'concluido', texto: 'Concluir' }
};

export default function PedidoCard({
  pedido,
  onAvancar,
  onDespachar,
  onVerMapa
}: {
  pedido: Pedido;
  onAvancar: (id: string, status: string) => void;
  onDespachar: (pedido: Pedido) => void;
  onVerMapa: (pedido: Pedido) => void;
}) {
  const origem = ORIGEM_LABEL[pedido.origem] || ORIGEM_LABEL.balcao;
  const proximo = PROXIMO_STATUS[pedido.status];
  const temRastreio = pedido.status === 'saiu_entrega' && !!(pedido as any).rastreio_token;

  function tocarProximo() {
    if (!proximo) return;
    if (proximo.chave === 'saiu_entrega') {
      onDespachar(pedido);
    } else {
      onAvancar(pedido.id, proximo.chave);
    }
  }

  return (
    <div className="bg-navy rounded-xl border border-white/10 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-sm">#{pedido.numero_pedido}</span>
        <span className={`text-[10px] border rounded-full px-2 py-0.5 ${origem.cor}`}>{origem.texto}</span>
      </div>

      {pedido.cliente_nome && <p className="text-sm text-white/80">{pedido.cliente_nome}</p>}

      <ul className="text-xs text-white/50 mt-1.5 space-y-0.5">
        {pedido.pedido_itens?.map((item, i) => (
          <li key={i}>
            {item.quantidade}x {item.nome_produto}
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between mt-2.5">
        <span className="text-xs text-white/40">{formatarHoraBrasil(pedido.created_at)}</span>
        <span className="text-sm font-semibold text-gold">
          R$ {pedido.valor_total?.toFixed(2).replace('.', ',')}
        </span>
      </div>

      {temRastreio && (
        <button
          onClick={() => onVerMapa(pedido)}
          className="w-full mt-3 bg-blue/15 border border-blue/30 text-blue rounded-lg py-2 text-xs font-medium active:scale-[0.98] transition"
        >
          📍 Ver entregador no mapa
        </button>
      )}

      <button
        onClick={() => window.open(`/dashboard/imprimir/${pedido.id}`, '_blank')}
        className="w-full mt-2 bg-white/5 border border-white/10 text-white/60 rounded-lg py-2 text-xs font-medium active:scale-[0.98] transition"
      >
        🖨 Imprimir ticket
      </button>

      <button
        onClick={() => fetch(`/api/impressao/enfileirar/${pedido.id}`, { method: 'POST' })}
        className="w-full mt-2 bg-white/5 border border-white/10 text-white/40 rounded-lg py-1.5 text-[11px] active:scale-[0.98] transition"
      >
        Reenviar pra impressora automática
      </button>

      {proximo && (
        <button
          onClick={tocarProximo}
          className="w-full mt-2 bg-white/10 hover:bg-white/15 rounded-lg py-2 text-xs font-medium active:scale-[0.98] transition"
        >
          {proximo.texto}
        </button>
      )}
    </div>
  );
}
