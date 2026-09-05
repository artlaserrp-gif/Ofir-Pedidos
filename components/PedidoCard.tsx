'use client';

import type { Pedido } from '@/app/dashboard/page';

const ORIGEM_LABEL: Record<string, { texto: string; cor: string }> = {
  ifood: { texto: 'iFood', cor: 'bg-red-100 text-red-600' },
  balcao: { texto: 'Balcão', cor: 'bg-amber-100 text-amber-700' },
  delivery_proprio: { texto: 'Entrega própria', cor: 'bg-blue-100 text-blue-700' },
  cliente_online: { texto: 'Pedido online', cor: 'bg-emerald-100 text-emerald-700' }
};

const PROXIMO_STATUS: Record<string, { chave: string; texto: string } | null> = {
  recebido: { chave: 'preparo', texto: 'Iniciar preparo' },
  preparo: { chave: 'pronto', texto: 'Marcar pronto' },
  pronto: { chave: 'saiu_entrega', texto: 'Saiu p/ entrega' },
  saiu_entrega: { chave: 'concluido', texto: 'Concluir' }
};

export default function PedidoCard({
  pedido,
  tempoTexto,
  onAvancar,
  onDespachar,
  onVerMapa
}: {
  pedido: Pedido;
  tempoTexto: string;
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
    <div className="bg-white rounded-xl p-3 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-sm text-black/80">#{pedido.numero_pedido}</span>
        <span className={`text-[10px] font-medium rounded-full px-2 py-0.5 ${origem.cor}`}>{origem.texto}</span>
      </div>

      {pedido.cliente_nome && <p className="text-sm text-black/70">{pedido.cliente_nome}</p>}

      <ul className="text-xs text-black/45 mt-1.5 space-y-0.5">
        {pedido.pedido_itens?.map((item, i) => (
          <li key={i}>
            {item.quantidade}x {item.nome_produto}
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between mt-2.5">
        <span className="text-[11px] text-black/35">{tempoTexto}</span>
        <span className="text-sm font-semibold text-black/80">
          R$ {pedido.valor_total?.toFixed(2).replace('.', ',')}
        </span>
      </div>

      {temRastreio && (
        <button
          onClick={() => onVerMapa(pedido)}
          className="w-full mt-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg py-2 text-xs font-medium active:scale-[0.98] transition"
        >
          📍 Ver entregador no mapa
        </button>
      )}

      <div className="flex gap-1.5 mt-2">
        <button
          onClick={() => window.open(`/dashboard/imprimir/${pedido.id}`, '_blank')}
          className="flex-1 bg-black/5 text-black/50 rounded-lg py-2 text-[11px] font-medium active:scale-[0.98] transition"
        >
          🖨 Imprimir
        </button>
        <button
          onClick={() => fetch(`/api/impressao/enfileirar/${pedido.id}`, { method: 'POST' })}
          className="flex-1 bg-black/5 text-black/40 rounded-lg py-2 text-[11px] active:scale-[0.98] transition"
        >
          Reenviar fila
        </button>
      </div>

      {proximo && (
        <button
          onClick={tocarProximo}
          className="w-full mt-2 bg-navy text-white rounded-lg py-2.5 text-xs font-semibold active:scale-[0.98] transition"
        >
          {proximo.texto} →
        </button>
      )}
    </div>
  );
}
