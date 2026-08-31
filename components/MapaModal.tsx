'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { formatarHoraBrasil } from '@/lib/brazilTime';

// carrega o mapa só no navegador — Leaflet não roda em servidor
const MapaEntregador = dynamic(() => import('./MapaEntregador'), { ssr: false });

export default function MapaModal({
  pedidoId,
  numeroPedido,
  onFechar
}: {
  pedidoId: string;
  numeroPedido: string;
  onFechar: () => void;
}) {
  const [posicao, setPosicao] = useState<{ lat: number; lng: number; atualizado_em: string } | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function buscar() {
      const res = await fetch(`/api/pedidos/${pedidoId}/posicao`);
      if (res.ok) {
        const data = await res.json();
        setPosicao(data.posicao);
      }
      setCarregando(false);
    }
    buscar();
    const intervalo = setInterval(buscar, 6000); // atualiza a cada 6s
    return () => clearInterval(intervalo);
  }, [pedidoId]);

  return (
    <div className="fixed inset-0 bg-black/70 z-30 flex items-end sm:items-center justify-center">
      <div className="bg-navy2 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Entregador — Pedido #{numeroPedido}</h2>
          <button onClick={onFechar} className="text-white/50 text-xl leading-none px-2">
            ×
          </button>
        </div>

        {carregando ? (
          <p className="text-white/40 text-sm text-center py-16">Buscando posição...</p>
        ) : !posicao ? (
          <p className="text-white/40 text-sm text-center py-16">
            O entregador ainda não iniciou o rastreio da entrega.
          </p>
        ) : (
          <>
            <MapaEntregador lat={posicao.lat} lng={posicao.lng} />
            <p className="text-xs text-white/40 mt-3">
              Última atualização: {formatarHoraBrasil(posicao.atualizado_em)}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
