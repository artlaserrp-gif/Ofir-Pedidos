'use client';

import { useState } from 'react';

type ItemExtraido = { nome: string; categoria: string | null; preco: number; incluir: boolean };

export default function ImportarCardapioModal({
  onFechar,
  onImportado
}: {
  onFechar: () => void;
  onImportado: () => void;
}) {
  const [etapa, setEtapa] = useState<'foto' | 'lendo' | 'revisar'>('foto');
  const [itens, setItens] = useState<ItemExtraido[]>([]);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function processarFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setErro('');
    setEtapa('lendo');

    const form = new FormData();
    form.set('imagem', arquivo);

    try {
      const res = await fetch('/api/cardapio/importar', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || 'Não foi possível ler o cardápio.');
        setEtapa('foto');
        return;
      }
      setItens(data.itens.map((i: any) => ({ ...i, incluir: true })));
      setEtapa('revisar');
    } catch {
      setErro('Falha de conexão. Tente novamente.');
      setEtapa('foto');
    }
  }

  function atualizarItem(i: number, campo: keyof ItemExtraido, valor: string | boolean) {
    setItens((prev) => prev.map((item, idx) => (idx === i ? { ...item, [campo]: valor } : item)));
  }

  async function salvarSelecionados() {
    const selecionados = itens.filter((i) => i.incluir && i.nome.trim());
    if (selecionados.length === 0) {
      setErro('Selecione ao menos um item.');
      return;
    }
    setSalvando(true);
    const res = await fetch('/api/produtos/importar-lote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itens: selecionados })
    });
    setSalvando(false);
    if (res.ok) onImportado();
    else setErro('Erro ao salvar os itens.');
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-30 flex items-end sm:items-center justify-center">
      <div className="bg-navy2 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Importar cardápio por foto</h2>
          <button onClick={onFechar} className="text-white/50 text-xl leading-none px-2">
            ×
          </button>
        </div>

        {etapa === 'foto' && (
          <>
            <p className="text-white/50 text-sm mb-4">
              Tire uma foto nítida do seu cardápio (impresso, quadro ou cartaz) e a IA identifica os
              itens e preços automaticamente pra você revisar antes de salvar.
            </p>
            <label className="block">
              <div className="w-full aspect-video bg-navy border border-white/10 border-dashed rounded-xl flex items-center justify-center">
                <span className="text-white/40 text-sm">📷 Toque para tirar ou escolher a foto</span>
              </div>
              <input type="file" accept="image/*" capture="environment" onChange={processarFoto} className="hidden" />
            </label>
            {erro && <p className="text-red-400 text-sm mt-3">{erro}</p>}
          </>
        )}

        {etapa === 'lendo' && (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/50 text-sm">Lendo o cardápio...</p>
          </div>
        )}

        {etapa === 'revisar' && (
          <>
            <p className="text-white/50 text-sm mb-3">
              Confira e ajuste antes de salvar. Desmarque o que não quiser importar.
            </p>
            <div className="space-y-2 mb-4">
              {itens.map((item, i) => (
                <div
                  key={i}
                  className={`bg-navy border rounded-xl p-2.5 flex items-center gap-2 ${
                    item.incluir ? 'border-white/10' : 'border-white/5 opacity-40'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.incluir}
                    onChange={(e) => atualizarItem(i, 'incluir', e.target.checked)}
                    className="w-4 h-4 accent-gold shrink-0"
                  />
                  <input
                    value={item.nome}
                    onChange={(e) => atualizarItem(i, 'nome', e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none min-w-0"
                  />
                  <input
                    value={item.preco}
                    onChange={(e) => atualizarItem(i, 'preco', e.target.value)}
                    type="number"
                    step="0.01"
                    className="w-16 bg-navy2 border border-white/10 rounded px-1.5 py-1 text-xs text-right outline-none focus:border-gold"
                  />
                </div>
              ))}
            </div>

            {erro && <p className="text-red-400 text-sm mb-3">{erro}</p>}

            <button
              onClick={salvarSelecionados}
              disabled={salvando}
              className="w-full bg-gold text-navy font-semibold rounded-xl py-3 active:scale-[0.98] transition disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : `Adicionar ${itens.filter((i) => i.incluir).length} itens ao cardápio`}
            </button>
            <p className="text-white/30 text-xs text-center mt-3">
              As fotos individuais de cada prato podem ser adicionadas depois, editando o item.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
