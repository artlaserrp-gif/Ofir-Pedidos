'use client';

import { useEffect, useMemo, useState } from 'react';

type Produto = { id: string; nome: string; categoria: string | null; descricao: string | null; preco: number; imagem_url: string | null };
type ItemCarrinho = { produto_id: string; nome: string; preco: number; quantidade: number };
type Loja = { nome: string; logo_url: string | null; cor_tema: string; tempo_estimado_balcao?: string; tempo_estimado_entrega?: string };

// decide se o texto em cima da cor da marca deve ser escuro ou claro
function corDeTextoLegivel(hex: string): string {
  const limpo = hex.replace('#', '');
  const r = parseInt(limpo.substring(0, 2), 16) / 255;
  const g = parseInt(limpo.substring(2, 4), 16) / 255;
  const b = parseInt(limpo.substring(4, 6), 16) / 255;
  const luminancia = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminancia > 0.6 ? '#241C15' : '#FFFFFF';
}

export default function CardapioPublico({ params }: { params: { slug: string } }) {
  const [loja, setLoja] = useState<Loja | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState('');
  const [checkoutAberto, setCheckoutAberto] = useState(false);
  const [pedidoConfirmado, setPedidoConfirmado] = useState<string | null>(null);
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('');

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
        if (data.produtos.length > 0) {
          setCategoriaAtiva(data.produtos[0].categoria || 'Cardápio');
        }
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

  const porCategoria = useMemo(
    () =>
      produtos.reduce<Record<string, Produto[]>>((acc, p) => {
        const chave = p.categoria || 'Cardápio';
        acc[chave] = acc[chave] || [];
        acc[chave].push(p);
        return acc;
      }, {}),
    [produtos]
  );
  const categorias = Object.keys(porCategoria);

  function irParaCategoria(categoria: string) {
    setCategoriaAtiva(categoria);
    document.getElementById(`cat-${categoria}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

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

  const cor = loja?.cor_tema || '#F0B94F';
  const corTexto = corDeTextoLegivel(cor);

  const fontesEstilo = (
    <style>{`
      .fonte-titulo { font-family: 'Fraunces', Georgia, serif; }
      .fonte-corpo { font-family: 'Inter', -apple-system, sans-serif; }
      .borda-serrilhada { position: relative; }
      .borda-serrilhada::before {
        content: '';
        position: absolute;
        top: -9px; left: 0; right: 0; height: 9px;
        background-image:
          linear-gradient(135deg, #FFFDF9 50%, transparent 50%),
          linear-gradient(45deg, #FFFDF9 50%, transparent 50%);
        background-size: 18px 18px;
        background-position: left bottom;
        background-repeat: repeat-x;
      }
    `}</style>
  );

  if (carregando) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center fonte-corpo">
        {fontesEstilo}
        <p className="text-[#8A7B69] text-sm">Carregando cardápio...</p>
      </div>
    );
  }

  if (erroCarregamento) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center px-6 text-center fonte-corpo">
        {fontesEstilo}
        <p className="text-[#5C5045]">{erroCarregamento}</p>
      </div>
    );
  }

  if (pedidoConfirmado) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] flex flex-col items-center justify-center px-6 text-center fonte-corpo">
        {fontesEstilo}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-5 text-3xl"
          style={{ backgroundColor: cor, color: corTexto }}
        >
          ✓
        </div>
        <h1 className="fonte-titulo text-2xl font-semibold text-[#241C15] mb-1">Pedido enviado</h1>
        <p className="text-[#8A7B69] text-sm mb-1">Seu número é</p>
        <p className="fonte-titulo text-5xl font-semibold mb-5" style={{ color: cor }}>
          #{pedidoConfirmado}
        </p>
        <p className="text-[#8A7B69] text-sm max-w-xs leading-relaxed">
          {loja?.nome} recebeu seu pedido e vai te avisar pelo WhatsApp sobre o andamento.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6EF] pb-32 fonte-corpo">
      {fontesEstilo}

      {/* Hero */}
      <div className="relative pt-10 pb-14 px-6 text-center overflow-hidden" style={{ backgroundColor: cor }}>
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 1px, transparent 14px)'
          }}
        />
        <div className="relative">
          <div
            className="w-20 h-20 rounded-full mx-auto mb-3 border-4 overflow-hidden flex items-center justify-center bg-[#FAF6EF]"
            style={{ borderColor: corTexto === '#FFFFFF' ? 'rgba(255,255,255,0.5)' : 'rgba(36,28,21,0.15)' }}
          >
            {loja?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={loja.logo_url} alt={loja.nome} className="w-full h-full object-cover" />
            ) : (
              <span className="fonte-titulo text-2xl text-[#241C15]">{loja?.nome?.[0] || '?'}</span>
            )}
          </div>
          <h1 className="fonte-titulo text-2xl font-semibold" style={{ color: corTexto }}>
            {loja?.nome}
          </h1>
          <p className="text-xs mt-1 opacity-80" style={{ color: corTexto }}>
            Monte seu pedido abaixo
          </p>
          {(loja?.tempo_estimado_balcao || loja?.tempo_estimado_entrega) && (
            <div className="flex items-center justify-center gap-3 mt-2 text-[11px] opacity-70" style={{ color: corTexto }}>
              {loja?.tempo_estimado_balcao && <span>🏪 Retirada: {loja.tempo_estimado_balcao}</span>}
              {loja?.tempo_estimado_entrega && <span>🛵 Entrega: {loja.tempo_estimado_entrega}</span>}
            </div>
          )}
        </div>
      </div>

      {/* Navegação de categorias */}
      {categorias.length > 1 && (
        <div className="sticky top-0 z-10 bg-[#FAF6EF]/95 backdrop-blur border-b border-[#EAE1D3] px-4 py-3 overflow-x-auto whitespace-nowrap">
          {categorias.map((cat) => (
            <button
              key={cat}
              onClick={() => irParaCategoria(cat)}
              className="inline-block mr-2 px-4 py-1.5 rounded-full text-xs font-medium border transition"
              style={
                categoriaAtiva === cat
                  ? { backgroundColor: cor, color: corTexto, borderColor: cor }
                  : { borderColor: '#EAE1D3', color: '#8A7B69' }
              }
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="px-4 pt-5 max-w-lg mx-auto">
        {produtos.length === 0 && (
          <p className="text-[#8A7B69] text-center mt-12 text-sm">Cardápio ainda não disponível.</p>
        )}
        {categorias.map((categoria) => (
          <div key={categoria} id={`cat-${categoria}`} className="mb-7 scroll-mt-20">
            <h2 className="fonte-titulo text-lg font-semibold text-[#241C15] mb-3">{categoria}</h2>
            <div className="space-y-3">
              {porCategoria[categoria].map((produto) => {
                const noCarrinho = carrinho.find((i) => i.produto_id === produto.id);
                return (
                  <div
                    key={produto.id}
                    className="bg-white rounded-2xl p-3 flex items-center gap-3 shadow-[0_2px_10px_rgba(36,28,21,0.06)]"
                  >
                    <div className="w-[68px] h-[68px] rounded-xl bg-[#F3ECE0] overflow-hidden shrink-0 flex items-center justify-center">
                      {produto.imagem_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={produto.imagem_url} alt={produto.nome} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[#C4B8A4] text-[10px]">Sem foto</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#241C15] truncate">{produto.nome}</p>
                      {produto.descricao && (
                        <p className="text-[11px] text-[#A0937E] line-clamp-2 mt-0.5 leading-snug">
                          {produto.descricao}
                        </p>
                      )}
                      <p className="text-sm font-semibold mt-1" style={{ color: cor }}>
                        R$ {produto.preco.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                    {noCarrinho ? (
                      <div className="flex items-center gap-2.5 shrink-0">
                        <button
                          onClick={() => alterarQuantidade(produto.id, -1)}
                          className="w-7 h-7 rounded-full bg-[#F3ECE0] text-[#241C15] flex items-center justify-center"
                        >
                          −
                        </button>
                        <span className="text-sm w-4 text-center text-[#241C15]">{noCarrinho.quantidade}</span>
                        <button
                          onClick={() => alterarQuantidade(produto.id, 1)}
                          className="w-7 h-7 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: cor, color: corTexto }}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => adicionar(produto)}
                        className="shrink-0 text-xs font-semibold rounded-full px-3.5 py-2 active:scale-95 transition"
                        style={{ backgroundColor: cor, color: corTexto }}
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
          className="fixed bottom-5 left-4 right-4 max-w-lg mx-auto rounded-2xl py-4 flex items-center justify-between px-5 shadow-[0_8px_24px_rgba(36,28,21,0.25)] active:scale-[0.98] transition"
          style={{ backgroundColor: cor, color: corTexto }}
        >
          <span className="text-sm font-medium">
            {totalItens} {totalItens === 1 ? 'item' : 'itens'}
          </span>
          <span className="text-sm font-semibold">R$ {total.toFixed(2).replace('.', ',')} · Ver sacola</span>
        </button>
      )}

      {checkoutAberto && (
        <div className="fixed inset-0 bg-[#241C15]/60 z-30 flex items-end justify-center">
          <div className="bg-[#FFFDF9] w-full max-w-lg rounded-t-3xl pt-4 px-5 pb-6 max-h-[92vh] overflow-y-auto borda-serrilhada">
            <div className="w-10 h-1 bg-[#EAE1D3] rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="fonte-titulo text-lg font-semibold text-[#241C15]">Sua sacola</h2>
              <button onClick={() => setCheckoutAberto(false)} className="text-[#8A7B69] text-xl leading-none px-2">
                ×
              </button>
            </div>

            <div className="mb-5">
              {carrinho.map((i, idx) => (
                <div
                  key={i.produto_id}
                  className={`flex justify-between text-sm py-2 ${
                    idx < carrinho.length - 1 ? 'border-b border-dashed border-[#DCD2C0]' : ''
                  }`}
                >
                  <span className="text-[#241C15]">
                    {i.quantidade}x {i.nome}
                  </span>
                  <span className="text-[#241C15] font-medium">R$ {(i.preco * i.quantidade).toFixed(2).replace('.', ',')}</span>
                </div>
              ))}
              <div className="border-t border-[#241C15] mt-2 pt-2 flex justify-between fonte-titulo font-semibold text-[#241C15]">
                <span>Total</span>
                <span>R$ {total.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>

            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome"
              className="w-full bg-white border border-[#EAE1D3] rounded-xl px-3.5 py-3 mb-3 outline-none focus:border-[#241C15] text-[#241C15] placeholder:text-[#B8AB98]"
            />
            <input
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="Seu WhatsApp"
              inputMode="tel"
              className="w-full bg-white border border-[#EAE1D3] rounded-xl px-3.5 py-3 mb-3 outline-none focus:border-[#241C15] text-[#241C15] placeholder:text-[#B8AB98]"
            />

            <div className="flex gap-2 mb-3">
              {(['retirada', 'entrega'] as const).map((op) => (
                <button
                  key={op}
                  onClick={() => setTipoEntrega(op)}
                  className="flex-1 rounded-xl py-2.5 text-sm border transition font-medium"
                  style={
                    tipoEntrega === op
                      ? { backgroundColor: cor, color: corTexto, borderColor: cor }
                      : { borderColor: '#EAE1D3', color: '#8A7B69' }
                  }
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
                className="w-full bg-white border border-[#EAE1D3] rounded-xl px-3.5 py-3 mb-3 outline-none focus:border-[#241C15] text-[#241C15] placeholder:text-[#B8AB98]"
              />
            )}

            <input
              value={pagamento}
              onChange={(e) => setPagamento(e.target.value)}
              placeholder="Forma de pagamento (ex: Pix, Dinheiro)"
              className="w-full bg-white border border-[#EAE1D3] rounded-xl px-3.5 py-3 mb-3 outline-none focus:border-[#241C15] text-[#241C15] placeholder:text-[#B8AB98]"
            />
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações (opcional)"
              rows={2}
              className="w-full bg-white border border-[#EAE1D3] rounded-xl px-3.5 py-3 mb-3 outline-none focus:border-[#241C15] text-[#241C15] placeholder:text-[#B8AB98] resize-none"
            />

            {erroEnvio && <p className="text-red-600 text-sm mb-3">{erroEnvio}</p>}

            <button
              onClick={enviarPedido}
              disabled={enviando}
              className="w-full rounded-xl py-3.5 font-semibold active:scale-[0.98] transition disabled:opacity-50"
              style={{ backgroundColor: cor, color: corTexto }}
            >
              {enviando ? 'Enviando...' : 'Confirmar pedido'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
