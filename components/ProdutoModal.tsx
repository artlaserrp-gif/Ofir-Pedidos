'use client';

import { useState } from 'react';

export type Produto = {
  id: string;
  nome: string;
  categoria: string | null;
  preco: number;
  imagem_url: string | null;
  ativo: boolean;
};

export default function ProdutoModal({
  produto,
  onFechar,
  onSalvo
}: {
  produto: Produto | null;
  onFechar: () => void;
  onSalvo: () => void;
}) {
  const [nome, setNome] = useState(produto?.nome || '');
  const [categoria, setCategoria] = useState(produto?.categoria || '');
  const [preco, setPreco] = useState(produto?.preco?.toString() || '');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [previa, setPrevia] = useState<string | null>(produto?.imagem_url || null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  function escolherFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setArquivo(f);
    setPrevia(URL.createObjectURL(f));
  }

  async function salvar() {
    setErro('');
    if (!nome.trim() || !preco) {
      setErro('Preencha nome e preço.');
      return;
    }
    setSalvando(true);

    const form = new FormData();
    form.set('nome', nome);
    form.set('categoria', categoria);
    form.set('preco', preco);
    form.set('ativo', 'true');
    if (arquivo) form.set('imagem', arquivo);

    const url = produto ? `/api/produtos/${produto.id}` : '/api/produtos';
    const metodo = produto ? 'PATCH' : 'POST';

    const res = await fetch(url, { method: metodo, body: form });
    setSalvando(false);

    if (!res.ok) {
      const data = await res.json();
      setErro(data.erro || 'Erro ao salvar.');
      return;
    }
    onSalvo();
  }

  async function excluir() {
    if (!produto) return;
    setSalvando(true);
    await fetch(`/api/produtos/${produto.id}`, { method: 'DELETE' });
    setSalvando(false);
    onSalvo();
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-30 flex items-end sm:items-center justify-center">
      <div className="bg-navy2 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">{produto ? 'Editar item' : 'Novo item do cardápio'}</h2>
          <button onClick={onFechar} className="text-white/50 text-xl leading-none px-2">
            ×
          </button>
        </div>

        <label className="block mb-4">
          <div className="w-full aspect-video bg-navy border border-white/10 border-dashed rounded-xl flex items-center justify-center overflow-hidden">
            {previa ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previa} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white/30 text-sm">Toque para adicionar foto</span>
            )}
          </div>
          <input type="file" accept="image/*" capture="environment" onChange={escolherFoto} className="hidden" />
        </label>

        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome do item"
          className="w-full bg-navy border border-white/10 rounded-xl px-3 py-2.5 mb-3 outline-none focus:border-gold"
        />
        <input
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          placeholder="Categoria (ex: Lanches, Bebidas)"
          className="w-full bg-navy border border-white/10 rounded-xl px-3 py-2.5 mb-3 outline-none focus:border-gold"
        />
        <input
          value={preco}
          onChange={(e) => setPreco(e.target.value)}
          type="number"
          step="0.01"
          min="0"
          placeholder="Preço (R$)"
          className="w-full bg-navy border border-white/10 rounded-xl px-3 py-2.5 mb-4 outline-none focus:border-gold"
        />

        {erro && <p className="text-red-400 text-sm mb-3">{erro}</p>}

        <button
          onClick={salvar}
          disabled={salvando}
          className="w-full bg-gold text-navy font-semibold rounded-xl py-3 active:scale-[0.98] transition disabled:opacity-50"
        >
          {salvando ? 'Salvando...' : 'Salvar'}
        </button>

        {produto && (
          <button
            onClick={excluir}
            disabled={salvando}
            className="w-full text-red-400 text-sm mt-3 py-2 disabled:opacity-50"
          >
            Remover do cardápio
          </button>
        )}
      </div>
    </div>
  );
}
