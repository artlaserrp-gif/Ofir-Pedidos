'use client';

import { useEffect, useState } from 'react';

type Entregador = { id: string; nome: string; telefone: string | null };

export default function DespacharModal({
  pedidoId,
  numeroPedido,
  onFechar,
  onDespachado
}: {
  pedidoId: string;
  numeroPedido: string;
  onFechar: () => void;
  onDespachado: () => void;
}) {
  const [entregadores, setEntregadores] = useState<Entregador[]>([]);
  const [nomeNovo, setNomeNovo] = useState('');
  const [telefoneNovo, setTelefoneNovo] = useState('');
  const [mostrarNovo, setMostrarNovo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [linkGerado, setLinkGerado] = useState<{ url: string; telefone: string | null } | null>(null);

  useEffect(() => {
    fetch('/api/entregadores')
      .then((r) => r.json())
      .then((d) => setEntregadores(d.entregadores || []));
  }, []);

  async function adicionarEntregador() {
    if (!nomeNovo.trim()) return;
    setSalvando(true);
    const res = await fetch('/api/entregadores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: nomeNovo, telefone: telefoneNovo })
    });
    setSalvando(false);
    if (res.ok) {
      const data = await res.json();
      setEntregadores((prev) => [...prev, data.entregador]);
      setNomeNovo('');
      setTelefoneNovo('');
      setMostrarNovo(false);
    }
  }

  async function despachar(entregador: Entregador | null) {
    setSalvando(true);
    const res = await fetch(`/api/pedidos/${pedidoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'saiu_entrega', entregador_id: entregador?.id || null })
    });
    setSalvando(false);
    if (!res.ok) return;

    const data = await res.json();

    if (entregador && data.pedido?.rastreio_token) {
      const url = `${window.location.origin}/entrega/${data.pedido.rastreio_token}`;
      setLinkGerado({ url, telefone: entregador.telefone });
    } else {
      onDespachado();
    }
  }

  if (linkGerado) {
    const telefoneLimpo = linkGerado.telefone?.replace(/\D/g, '');
    const mensagem = encodeURIComponent(
      `Oi! Segue o link pra rastrear a entrega do pedido #${numeroPedido}: ${linkGerado.url}`
    );
    const linkWhatsapp = telefoneLimpo
      ? `https://wa.me/55${telefoneLimpo}?text=${mensagem}`
      : `https://wa.me/?text=${mensagem}`;

    return (
      <div className="fixed inset-0 bg-black/70 z-30 flex items-end sm:items-center justify-center">
        <div className="bg-navy2 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-5 text-center">
          <p className="text-green-400 text-sm mb-1">Pedido despachado!</p>
          <h2 className="font-bold text-lg mb-4">Link de rastreio pronto</h2>
          <a
            href={linkWhatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-green-500 text-white font-semibold rounded-xl py-3 mb-2 active:scale-[0.98] transition"
          >
            Enviar no WhatsApp
          </a>
          <button
            onClick={() => navigator.clipboard.writeText(linkGerado.url)}
            className="block w-full border border-white/15 text-white/70 rounded-xl py-2.5 text-sm mb-4 active:scale-[0.98] transition"
          >
            Copiar link
          </button>
          <button onClick={onDespachado} className="text-white/40 text-sm">
            Fechar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-30 flex items-end sm:items-center justify-center">
      <div className="bg-navy2 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-bold text-lg">Despachar pedido #{numeroPedido}</h2>
          <button onClick={onFechar} className="text-white/50 text-xl leading-none px-2">
            ×
          </button>
        </div>
        <p className="text-white/40 text-xs mb-4">
          Escolher um entregador ativa o rastreamento ao vivo. É opcional.
        </p>

        <div className="space-y-2 mb-3">
          {entregadores.map((e) => (
            <button
              key={e.id}
              disabled={salvando}
              onClick={() => despachar(e)}
              className="w-full flex items-center justify-between bg-navy border border-white/10 rounded-xl px-4 py-3 active:scale-[0.98] transition disabled:opacity-50"
            >
              <span className="text-sm">{e.nome}</span>
              <span className="text-xs text-blue">Despachar →</span>
            </button>
          ))}
          {entregadores.length === 0 && !mostrarNovo && (
            <p className="text-white/30 text-sm text-center py-4">Nenhum entregador cadastrado ainda.</p>
          )}
        </div>

        {mostrarNovo ? (
          <div className="bg-navy border border-white/10 rounded-xl p-3 space-y-2 mb-3">
            <input
              value={nomeNovo}
              onChange={(e) => setNomeNovo(e.target.value)}
              placeholder="Nome do entregador"
              className="w-full bg-navy2 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold"
            />
            <input
              value={telefoneNovo}
              onChange={(e) => setTelefoneNovo(e.target.value)}
              placeholder="Telefone (WhatsApp, opcional)"
              className="w-full bg-navy2 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold"
              inputMode="tel"
            />
            <button
              onClick={adicionarEntregador}
              disabled={salvando}
              className="w-full bg-gold text-navy font-semibold rounded-lg py-2 text-sm disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : 'Adicionar e continuar'}
            </button>
          </div>
        ) : (
          <button onClick={() => setMostrarNovo(true)} className="text-xs text-blue mb-4">
            + cadastrar novo entregador
          </button>
        )}

        <button
          disabled={salvando}
          onClick={() => despachar(null)}
          className="w-full border border-white/15 text-white/60 rounded-xl py-3 text-sm mt-2 active:scale-[0.98] transition disabled:opacity-50"
        >
          Despachar sem rastreio
        </button>
      </div>
    </div>
  );
}
