'use client';

import { useEffect, useState } from 'react';
import { formatarDataHoraBrasil } from '@/lib/brazilTime';

type ItemPedido = { nome_produto: string; quantidade: number; preco_unitario: number; observacoes: string | null };
type Pedido = {
  numero_pedido: string;
  origem: string;
  cliente_nome: string | null;
  cliente_telefone: string | null;
  tipo_entrega: string;
  endereco_entrega: string | null;
  forma_pagamento: string | null;
  observacoes: string | null;
  valor_itens: number;
  valor_entrega: number;
  valor_total: number;
  created_at: string;
  pedido_itens: ItemPedido[];
};

const ORIGEM_LABEL: Record<string, string> = {
  ifood: 'iFOOD',
  balcao: 'BALCÃO',
  delivery_proprio: 'ENTREGA PRÓPRIA',
  cliente_online: 'PEDIDO ONLINE'
};

export default function ImprimirPedidoPage({ params }: { params: { id: string } }) {
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [lojaNome, setLojaNome] = useState('');
  const [largura, setLargura] = useState<'58mm' | '80mm'>('80mm');

  useEffect(() => {
    Promise.all([
      fetch(`/api/pedidos/${params.id}`).then((r) => r.json()),
      fetch('/api/loja/configuracoes').then((r) => r.json())
    ]).then(([dPedido, dLoja]) => {
      setPedido(dPedido.pedido);
      setLojaNome(dLoja.nome || '');
      setLargura(dLoja.largura_papel_impressao === '58mm' ? '58mm' : '80mm');
      setTimeout(() => window.print(), 400);
    });
  }, [params.id]);

  if (!pedido) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/40 text-sm">Carregando ticket...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black flex flex-col items-center py-6 print:py-0 print:bg-white">
      <style>{`
        @page { size: ${largura} auto; margin: 2mm; }
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
        }
        .ticket { font-family: 'Courier New', monospace; }
      `}</style>

      <div
        className="ticket bg-white text-black px-3 py-4"
        style={{ width: largura === '58mm' ? '58mm' : '80mm', fontSize: largura === '58mm' ? '11px' : '12px' }}
      >
        <p className="text-center font-bold text-sm mb-1">{lojaNome}</p>
        <p className="text-center text-[10px] mb-2">{ORIGEM_LABEL[pedido.origem] || pedido.origem}</p>
        <div className="border-t border-dashed border-black my-2" />

        <p className="font-bold">PEDIDO #{pedido.numero_pedido}</p>
        <p className="text-[10px]">{formatarDataHoraBrasil(pedido.created_at)}</p>
        {pedido.cliente_nome && <p className="mt-1">Cliente: {pedido.cliente_nome}</p>}
        {pedido.cliente_telefone && <p>Tel: {pedido.cliente_telefone}</p>}
        {pedido.tipo_entrega === 'entrega' && pedido.endereco_entrega && (
          <p className="mt-1">End: {pedido.endereco_entrega}</p>
        )}

        <div className="border-t border-dashed border-black my-2" />

        {pedido.pedido_itens.map((item, i) => (
          <div key={i} className="mb-1.5">
            <div className="flex justify-between">
              <span>
                {item.quantidade}x {item.nome_produto}
              </span>
              <span>R$ {(item.preco_unitario * item.quantidade).toFixed(2).replace('.', ',')}</span>
            </div>
            {item.observacoes && <p className="text-[10px] pl-3">obs: {item.observacoes}</p>}
          </div>
        ))}

        <div className="border-t border-dashed border-black my-2" />

        <div className="flex justify-between text-[11px]">
          <span>Itens</span>
          <span>R$ {pedido.valor_itens.toFixed(2).replace('.', ',')}</span>
        </div>
        {pedido.valor_entrega > 0 && (
          <div className="flex justify-between text-[11px]">
            <span>Entrega</span>
            <span>R$ {pedido.valor_entrega.toFixed(2).replace('.', ',')}</span>
          </div>
        )}
        <div className="flex justify-between font-bold mt-1">
          <span>TOTAL</span>
          <span>R$ {pedido.valor_total.toFixed(2).replace('.', ',')}</span>
        </div>
        {pedido.forma_pagamento && <p className="mt-1 text-[11px]">Pagamento: {pedido.forma_pagamento}</p>}
        {pedido.observacoes && <p className="mt-2 text-[11px]">Obs: {pedido.observacoes}</p>}

        <div className="border-t border-dashed border-black my-2" />
        <p className="text-center text-[10px] mt-2">OFIR Pedidos</p>
      </div>

      <button
        onClick={() => window.print()}
        className="no-print mt-6 bg-gold text-navy font-semibold rounded-full px-6 py-2.5 text-sm"
      >
        Imprimir novamente
      </button>
    </div>
  );
}
