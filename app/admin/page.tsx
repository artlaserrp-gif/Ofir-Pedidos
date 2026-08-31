'use client';

import { useEffect, useState } from 'react';

type Loja = {
  id: string;
  nome: string;
  cnpj: string;
  telefone: string | null;
  plano: string;
  ativo: boolean;
  trial_expira_em: string | null;
  bloqueado_motivo: string | null;
  created_at: string;
};

export default function AdminPage() {
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');

  async function buscar() {
    const res = await fetch('/api/admin/lojas');
    if (res.ok) {
      const data = await res.json();
      setLojas(data.lojas || []);
    }
    setCarregando(false);
  }

  useEffect(() => {
    buscar();
  }, []);

  async function alternarAtivo(loja: Loja) {
    setLojas((prev) => prev.map((l) => (l.id === loja.id ? { ...l, ativo: !l.ativo } : l)));
    await fetch(`/api/admin/lojas/${loja.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ativo: !loja.ativo,
        bloqueado_motivo: !loja.ativo ? null : 'Bloqueado por falta de pagamento. Fale com o suporte.'
      })
    });
  }

  async function marcarComoPago(loja: Loja) {
    setLojas((prev) => prev.map((l) => (l.id === loja.id ? { ...l, plano: 'pago' } : l)));
    await fetch(`/api/admin/lojas/${loja.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plano: 'pago' })
    });
  }

  async function estenderTrial(loja: Loja) {
    await fetch(`/api/admin/lojas/${loja.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estenderTrialDias: 7 })
    });
    buscar();
  }

  function diasRestantes(trialExpiraEm: string | null) {
    if (!trialExpiraEm) return null;
    const diff = new Date(trialExpiraEm).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  const lojasFiltradas = lojas.filter(
    (l) => l.nome.toLowerCase().includes(busca.toLowerCase()) || l.cnpj.includes(busca)
  );

  return (
    <div className="min-h-screen pb-10">
      <header className="sticky top-0 z-10 bg-navy/95 backdrop-blur border-b border-white/10 px-4 py-3">
        <h1 className="font-bold text-lg">
          OFIR <span className="text-gold">Admin</span> · {lojas.length} empresas
        </h1>
      </header>

      <div className="px-4 pt-4">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou CNPJ"
          className="w-full bg-navy2 border border-white/10 rounded-xl px-4 py-2.5 mb-4 outline-none focus:border-gold"
        />

        {carregando ? (
          <p className="text-white/40 text-center mt-12">Carregando...</p>
        ) : (
          <div className="space-y-3">
            {lojasFiltradas.map((loja) => {
              const dias = diasRestantes(loja.trial_expira_em);
              const trialVencido = loja.plano === 'trial' && dias !== null && dias <= 0;

              return (
                <div key={loja.id} className="bg-navy2 border border-white/10 rounded-xl p-3.5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm">{loja.nome}</p>
                      <p className="text-white/40 text-xs">{loja.cnpj}</p>
                    </div>
                    <span
                      className={`text-[10px] border rounded-full px-2 py-0.5 shrink-0 ${
                        !loja.ativo
                          ? 'bg-red-500/20 text-red-400 border-red-500/40'
                          : loja.plano === 'pago'
                          ? 'bg-green-500/20 text-green-400 border-green-500/40'
                          : trialVencido
                          ? 'bg-red-500/20 text-red-400 border-red-500/40'
                          : 'bg-gold/20 text-gold border-gold/40'
                      }`}
                    >
                      {!loja.ativo
                        ? 'Bloqueado'
                        : loja.plano === 'pago'
                        ? 'Pago'
                        : trialVencido
                        ? 'Trial vencido'
                        : `Trial · ${dias}d`}
                    </span>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => alternarAtivo(loja)}
                      className={`flex-1 text-xs rounded-lg py-2 font-medium ${
                        loja.ativo ? 'bg-red-500/15 text-red-400' : 'bg-green-500/15 text-green-400'
                      }`}
                    >
                      {loja.ativo ? 'Bloquear' : 'Desbloquear'}
                    </button>
                    {loja.plano !== 'pago' && (
                      <button
                        onClick={() => marcarComoPago(loja)}
                        className="flex-1 text-xs rounded-lg py-2 font-medium bg-blue/15 text-blue"
                      >
                        Marcar como pago
                      </button>
                    )}
                    {loja.plano === 'trial' && (
                      <button
                        onClick={() => estenderTrial(loja)}
                        className="flex-1 text-xs rounded-lg py-2 font-medium bg-white/10 text-white/70"
                      >
                        +7 dias trial
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
