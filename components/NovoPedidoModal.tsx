'use client';

import { useEffect, useState } from 'react';
import type { Produto } from '@/components/ProdutoModal';

type ItemNovo = { produto_id?: string; nome_produto: string; quantidade: number; preco_unitario: number };

export default function NovoPedidoModal({
  onFechar,
  onCriado
}: {
  onFechar: () => void;
  onCriado: () => void;
}) {
  const [origem, setOrigem] = useState<'balcao' | 'delivery_proprio'>('balcao');
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [itens, setItens] = useState<ItemNovo[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [modoManual, setModoManual] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    fetch('/api/produtos')
      .then((r) => r.json())
      .then((d) => setProdutos((d.produtos || []).filter((p: Produto) => p.ativo)));
  }, []);

  function adicionarDoCardapio(produto: Produto) {
    setItens((prev) => {
      const existente = prev.find((i) => i.produto_id === produto.id);
      if (existente) {
        return prev.map((i) => (i.produto_id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i));
      }
      return [...prev, { produto_id: produto.id, nome_produto: produto.nome, quantidade: 1, preco_unitario: produto.preco }];
    });
  }

  function alterarQuantidade(index: number, delta: number) {
    setItens((prev) =>
      prev
        .map((item, i) => (i === index ? { ...item, quantidade: item.quantidade + delta } : item))
        .filter((item) => item.quantidade > 0)
    );
  }

  function adicionarItemManual() {
    setItens((prev) => [...prev, { nome_produto: '', quantidade: 1, preco_unitario: 0 }]);
  }

  function atualizarItemManual(i: number, campo: 'nome_produto' | 'quantidade' | 'preco_unitario', valor: string) {
    setItens((prev) =>
      prev.map((item, idx) =>
        idx === i ? { ...item, [campo]: campo === 'nome_produto' ? valor : Number(valor) } : item
      )
    );
  }

  function removerItem(i: number) {
    setItens((prev) => prev.filter((_, idx) => idx !== i));
  }

  const total = itens.reduce((s, i) => s + i.quantidade * i.preco_unitario, 0);

  async function salvar() {
    setErro('');
    const itensValidos = itens.filter((i) => i.nome_produto.trim() && i.quantidade > 0);
    if (itensValidos.length === 0) {
      setErro('Adicione ao menos um item.');
      return;
    }
    setSalvando(true);
    try {
      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origem,
          cliente_nome: clienteNome,
          cliente_telefone: clienteTelefone,
          endereco_entrega: origem === 'delivery_proprio' ? endereco : null,
          tipo_entrega: origem === 'delivery_proprio' ? 'entrega' : 'retirada',
          itens: itensValidos
        })
      });
      if (!res.ok) {
        const data = await res.json();
        setErro(data.erro || 'Erro ao salvar pedido.');
        return;
      }
      onCriado();
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-20 flex items-end sm:items-center justify-center">
      <div className="bg-navy2 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Novo pedido</h2>
          <button onClick={onFechar} className="text-white/50 text-xl leading-none px-2">
            ×
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          {(['balcao', 'delivery_proprio'] as const).map((op) => (
            <button
              key={op}
              onClick={() => setOrigem(op)}
              className={`flex-1 rounded-lg py-2 text-sm border transition ${
                origem === op ? 'bg-gold text-navy border-gold font-semibold' : 'border-white/15 text-white/60'
              }`}
            >
              {op === 'balcao' ? 'Balcão' : 'Entrega própria'}
            </button>
          ))}
        </div>

        <input
          value={clienteNome}
          onChange={(e) => setClienteNome(e.target.value)}
          placeholder="Nome do cliente (opcional)"
          className="w-full bg-navy border border-white/10 rounded-xl px-3 py-2.5 mb-3 outline-none focus:border-gold"
        />

        <input
          value={clienteTelefone}
          onChange={(e) => setClienteTelefone(e.target.value)}
          placeholder="WhatsApp do cliente (opcional — envia status)"
          inputMode="tel"
          className="w-full bg-navy border border-white/10 rounded-xl px-3 py-2.5 mb-3 outline-none focus:border-gold"
        />

        {origem === 'delivery_proprio' && (
          <input
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            placeholder="Endereço de entrega"
            className="w-full bg-navy border border-white/10 rounded-xl px-3 py-2.5 mb-3 outline-none focus:border-gold"
          />
        )}

        {/* Cardápio rápido */}
        {produtos.length > 0 && !modoManual && (
          <>
            <p className="text-xs text-white/50 mb-2">Toque para adicionar do cardápio</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {produtos.map((p) => (
                <button
                  key={p.id}
                  onClick={() => adicionarDoCardapio(p)}
                  className="bg-navy border border-white/10 rounded-lg p-2 text-left active:scale-95 transition"
                >
                  <p className="text-xs font-medium truncate">{p.nome}</p>
                  <p className="text-gold text-xs">R$ {p.preco.toFixed(2).replace('.', ',')}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Itens do pedido atual */}
        {itens.length > 0 && (
          <div className="space-y-2 mb-3">
            {itens.map((item, i) =>
              item.produto_id ? (
                <div key={i} className="flex items-center justify-between bg-navy rounded-lg px-3 py-2">
                  <span className="text-sm">{item.nome_produto}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => alterarQuantidade(i, -1)} className="text-white/50 w-6 h-6">
                      −
                    </button>
                    <span className="text-sm w-4 text-center">{item.quantidade}</span>
                    <button onClick={() => alterarQuantidade(i, 1)} className="text-white/50 w-6 h-6">
                      +
                    </button>
                  </div>
                </div>
              ) : (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    value={item.nome_produto}
                    onChange={(e) => atualizarItemManual(i, 'nome_produto', e.target.value)}
                    placeholder="Produto"
                    className="flex-1 bg-navy border border-white/10 rounded-lg px-2.5 py-2 text-sm outline-none focus:border-gold"
                  />
                  <input
                    value={item.quantidade}
                    onChange={(e) => atualizarItemManual(i, 'quantidade', e.target.value)}
                    type="number"
                    min={1}
                    className="w-14 bg-navy border border-white/10 rounded-lg px-2 py-2 text-sm text-center outline-none focus:border-gold"
                  />
                  <input
                    value={item.preco_unitario}
                    onChange={(e) => atualizarItemManual(i, 'preco_unitario', e.target.value)}
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="R$"
                    className="w-20 bg-navy border border-white/10 rounded-lg px-2 py-2 text-sm outline-none focus:border-gold"
                  />
                  <button onClick={() => removerItem(i)} className="text-white/40 px-1">
                    ×
                  </button>
                </div>
              )
            )}
          </div>
        )}

        <button
          onClick={() => {
            setModoManual(true);
            adicionarItemManual();
          }}
          className="text-xs text-blue mb-4"
        >
          + item avulso (fora do cardápio)
        </button>

        {itens.length > 0 && (
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-sm text-white/50">Total</span>
            <span className="text-lg font-bold text-gold">R$ {total.toFixed(2).replace('.', ',')}</span>
          </div>
        )}

        {erro && <p className="text-red-400 text-sm mb-3">{erro}</p>}

        <button
          onClick={salvar}
          disabled={salvando}
          className="w-full bg-gold text-navy font-semibold rounded-xl py-3 active:scale-[0.98] transition disabled:opacity-50"
        >
          {salvando ? 'Salvando...' : 'Criar pedido'}
        </button>
      </div>
    </div>
  );
}
