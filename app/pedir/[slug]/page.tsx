'use client';

import { useEffect, useState } from 'react';

type Produto = { id: string; nome: string; categoria: string | null; preco: number; imagem_url: string | null };
type ItemCarrinho = { produto_id: string; nome: string; preco: number; quantidade: number };

export default function CardapioPublico({ params }: { params: { slug: string } }) {
  const [loja, setLoja] = useState<{ nome: string; logo_url: string | null } | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState('');
  const [checkoutAberto, setCheckoutAberto] = useState(false);
  const [pedidoConfirmado, setPedidoConfirmado] = useState<string | null>(null);

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [tipoEntrega, setTipoEntrega] = useState<'retirada' | 'entrega'>('retirada');
  const [endereco, setEndereco] = useState('');
  const [pagamento, setPagamento] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState('');

  useEffect(() => {
    fetch(`/api/publico/${params.slug}`)
      .then(async (r) => {
        if (!r.ok) {
          const d = await r.json();
          setErroCarregamento(d.erro || 'Não foi possível carregar o cardápio.');
          return;
        }
        const data = await r.json();
        setLoja(data.loja);
        setProdutos(data.produtos);
      })
      .finally(() => setCarregando(false));
  }, [params.slug]);

  function adicionar(produto: Produto) {
    setCarrinho((prev) => {
      const existente = prev.find((i) => i.produto_id === produto.id);
      if (existente) {
        return prev.map((i) => (i.produto_id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i));
      }
      return [...prev, { produto_id: produto.id, nome: produto.nome, preco: produto.preco, quantidade: 1 }];
    });
  }

  function alterarQuantidade(produtoId: string, delta: number) {
    setCarrinho((prev) =>
      prev
        .map((i) => (i.produto_id === produtoId ? { ...i, quantidade: i.quantidade + delta } : i))
        .filter((i) => i.quantidade > 0)
    );
  }

  const total = carrinho.reduce((s, i) => s + i.preco * i.quantidade, 0);
  const totalItens = carrinho.reduce((s, i) => s + i.quantidade, 0);

  async function enviarPedido() {
    setErroEnvio('');
    if (!nome.trim() || !telefone.trim()) {
      setErroEnvio('Preencha seu nome e telefone.');
      return;
    }
    if (tipoEntrega === 'entrega' && !endereco.trim()) {
      setErroEnvio('Informe o endereço de entrega.');
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch(`/api/publico/${params.slug}/pedido`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_nome: nome,
          cliente_telefone: telefone,
          tipo_entrega: tipoEntrega,
          endereco_entrega: endereco,
          forma_pagamento: pagamento,
          observacoes,
          itens: carrinho.map((i) => ({ produto_id: i.produto_id, quantidade: i.quantidade }))
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setErroEnvio(data.erro || 'Erro ao enviar pedido.');
        return;
      }
      setPedidoConfirmado(data.numero_pedido);
    } catch {
      setErroEnvio('Falha de conexão. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <p className="text-white/40 text-sm">Carregando cardápio...</p>
      </div>
    );
  }

  if (erroCarregamento) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center px-6 text-center">
        <p className="text-white/60">{erroCarregamento}</p>
      </div>
    );
  }

  if (pedidoConfirmado) {
    return (
      <div className="min-h-screen bg-navy text-white flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center mb-4 text-3xl">
          ✅
        </div>
        <h1 className="text-xl font-bold mb-1">Pedido enviado!</h1>
        <p className="text-white/60 text-sm mb-1">Seu pedido é o número</p>
        <p className="text-3xl font-bold text-gold mb-4">#{pedidoConfirmado}</p>
        <p className="text-white/40 text-sm max-w-xs">
          {loja?.nome} já recebeu seu pedido e vai te avisar por WhatsApp sobre o andamento.
        </p>
      </div>
    );
  }

  const porCategoria = produtos.reduce<Record<string, Produto[]>>((acc, p) => {
    const chave = p.categoria || 'Outros';
    acc[chave] = acc[chave] || [];
    acc[chave].push(p);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-navy text-white pb-28">
      <header className="sticky top-0 z-10 bg-navy/95 backdrop-blur border-b border-white/10 px-4 py-4">
        <h1 className="font-bold text-xl">{loja?.nome}</h1>
        <p className="text-white/40 text-xs mt-0.5">Monte seu pedido</p>
      </header>

      <div className="px-4 pt-4">
        {produtos.length === 0 && (
          <p className="text-white/30 text-center mt-12 text-sm">Cardápio ainda não disponível.</p>
        )}
        {Object.entries(porCategoria).map(([categoria, itensCategoria]) => (
          <div key={categoria} className="mb-6">
            <h2 className="text-white/50 text-xs font-semibold uppercase tracking-wide mb-2 px-1">{categoria}</h2>
            <div className="space-y-2">
              {itensCategoria.map((produto) => {
                const noCarrinho = carrinho.find((i) => i.produto_id === produto.id);
                return (
                  <div
                    key={produto.id}
                    className="bg-navy2 border border-white/10 rounded-xl p-3 flex items-center gap-3"
                  >
                    <div className="w-16 h-16 rounded-lg bg-navy overflow-hidden shrink-0 flex items-center justify-center">
                      {produto.imagem_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={produto.imagem_url} alt={produto.nome} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white/20 text-xs">Sem foto</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{produto.nome}</p>
                      <p className="text-gold text-sm font-semibold">R$ {produto.preco.toFixed(2).replace('.', ',')}</p>
                    </div>
                    {noCarrinho ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => alterarQuantidade(produto.id, -1)}
                          className="w-7 h-7 rounded-full bg-white/10 text-white"
                        >
                          −
                        </button>
                        <span className="text-sm w-4 text-center">{noCarrinho.quantidade}</span>
                        <button
                          onClick={() => alterarQuantidade(produto.id, 1)}
                          className="w-7 h-7 rounded-full bg-white/10 text-white"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => adicionar(produto)}
                        className="shrink-0 bg-gold text-navy text-xs font-semibold rounded-full px-3 py-1.5 active:scale-95 transition"
                      >
                        Adicionar
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {totalItens > 0 && !checkoutAberto && (
        <button
          onClick={() => setCheckoutAberto(true)}
          className="fixed bottom-6 left-4 right-4 bg-gold text-navy font-bold rounded-xl py-3.5 flex items-center justify-between px-5 shadow-lg active:scale-[0.98] transition"
        >
          <span>{totalItens} {totalItens === 1 ? 'item' : 'itens'}</span>
          <span>R$ {total.toFixed(2).replace('.', ',')} → Continuar</span>
        </button>
      )}

      {checkoutAberto && (
        <div className="fixed inset-0 bg-black/70 z-30 flex items-end sm:items-center justify-center">
          <div className="bg-navy2 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Finalizar pedido</h2>
              <button onClick={() => setCheckoutAberto(false)} className="text-white/50 text-xl leading-none px-2">
                ×
              </button>
            </div>

            <div className="bg-navy rounded-xl p-3 mb-4 space-y-1">
              {carrinho.map((i) => (
                <div key={i.produto_id} className="flex justify-between text-sm">
                  <span>{i.quantidade}x {i.nome}</span>
                  <span>R$ {(i.preco * i.quantidade).toFixed(2).replace('.', ',')}</span>
                </div>
              ))}
              <div className="border-t border-white/10 mt-2 pt-2 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-gold">R$ {total.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>

            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome"
              className="w-full bg-navy border border-white/10 rounded-xl px-3 py-2.5 mb-3 outline-none focus:border-gold"
            />
            <input
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="Seu WhatsApp"
              inputMode="tel"
              className="w-full bg-navy border border-white/10 rounded-xl px-3 py-2.5 mb-3 outline-none focus:border-gold"
            />

            <div className="flex gap-2 mb-3">
              {(['retirada', 'entrega'] as const).map((op) => (
                <button
                  key={op}
                  onClick={() => setTipoEntrega(op)}
                  className={`flex-1 rounded-lg py-2 text-sm border transition ${
                    tipoEntrega === op ? 'bg-gold text-navy border-gold font-semibold' : 'border-white/15 text-white/60'
                  }`}
                >
                  {op === 'retirada' ? 'Retirar no local' : 'Entrega'}
                </button>
              ))}
            </div>

            {tipoEntrega === 'entrega' && (
              <input
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Endereço completo"
                className="w-full bg-navy border border-white/10 rounded-xl px-3 py-2.5 mb-3 outline-none focus:border-gold"
              />
            )}

            <input
              value={pagamento}
              onChange={(e) => setPagamento(e.target.value)}
              placeholder="Forma de pagamento (ex: Pix, Dinheiro)"
              className="w-full bg-navy border border-white/10 rounded-xl px-3 py-2.5 mb-3 outline-none focus:border-gold"
            />
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações (opcional)"
              rows={2}
              className="w-full bg-navy border border-white/10 rounded-xl px-3 py-2.5 mb-3 outline-none focus:border-gold resize-none"
            />

            {erroEnvio && <p className="text-red-400 text-sm mb-3">{erroEnvio}</p>}

            <button
              onClick={enviarPedido}
              disabled={enviando}
              className="w-full bg-gold text-navy font-semibold rounded-xl py-3 active:scale-[0.98] transition disabled:opacity-50"
            >
              {enviando ? 'Enviando...' : 'Confirmar pedido'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
