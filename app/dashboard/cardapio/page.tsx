'use client';

import { useEffect, useState } from 'react';
import ProdutoModal, { Produto } from '@/components/ProdutoModal';
import ImportarCardapioModal from '@/components/ImportarCardapioModal';

export default function CardapioPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [importarAberto, setImportarAberto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);

  async function buscar() {
    const res = await fetch('/api/produtos');
    if (res.ok) {
      const data = await res.json();
      setProdutos((data.produtos || []).filter((p: Produto) => p.ativo));
    }
    setCarregando(false);
  }

  useEffect(() => {
    buscar();
  }, []);

  const porCategoria = produtos.reduce<Record<string, Produto[]>>((acc, p) => {
    const chave = p.categoria || 'Outros';
    acc[chave] = acc[chave] || [];
    acc[chave].push(p);
    return acc;
  }, {});

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-10 bg-navy/95 backdrop-blur border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <h1 className="font-bold text-lg">
          Cardápio <span className="text-gold">·</span> {produtos.length} itens
        </h1>
        <button
          onClick={() => setImportarAberto(true)}
          className="text-xs bg-gold/15 text-gold border border-gold/40 rounded-full px-3 py-1.5 active:scale-95 transition"
        >
          📷 Importar foto
        </button>
      </header>

      <div className="px-4 pt-4">
        {carregando ? (
          <p className="text-white/40 text-center mt-12">Carregando...</p>
        ) : produtos.length === 0 ? (
          <p className="text-white/30 text-center mt-12 text-sm">
            Nenhum item cadastrado ainda. Toque no + para adicionar.
          </p>
        ) : (
          Object.entries(porCategoria).map(([categoria, itens]) => (
            <div key={categoria} className="mb-6">
              <h2 className="text-white/50 text-xs font-semibold uppercase tracking-wide mb-2 px-1">
                {categoria}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {itens.map((produto) => (
                  <button
                    key={produto.id}
                    onClick={() => {
                      setProdutoEditando(produto);
                      setModalAberto(true);
                    }}
                    className="bg-navy2 border border-white/10 rounded-xl overflow-hidden text-left active:scale-[0.98] transition"
                  >
                    <div className="aspect-video bg-navy flex items-center justify-center">
                      {produto.imagem_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={produto.imagem_url} alt={produto.nome} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white/20 text-xs">Sem foto</span>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="text-sm font-medium truncate">{produto.nome}</p>
                      <p className="text-gold text-sm font-semibold mt-0.5">
                        R$ {produto.preco.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <button
        onClick={() => {
          setProdutoEditando(null);
          setModalAberto(true);
        }}
        className="fixed bottom-24 right-6 bg-gold text-navy font-bold rounded-full w-14 h-14 flex items-center justify-center text-2xl shadow-lg active:scale-95 transition"
      >
        +
      </button>

      {modalAberto && (
        <ProdutoModal
          produto={produtoEditando}
          onFechar={() => setModalAberto(false)}
          onSalvo={() => {
            setModalAberto(false);
            buscar();
          }}
        />
      )}

      {importarAberto && (
        <ImportarCardapioModal
          onFechar={() => setImportarAberto(false)}
          onImportado={() => {
            setImportarAberto(false);
            buscar();
          }}
        />
      )}
    </div>
  );
}
