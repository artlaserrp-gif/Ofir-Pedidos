'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CadastroPage() {
  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [telefone, setTelefone] = useState('');
  const [pin, setPin] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  async function cadastrar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      const res = await fetch('/api/auth/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, cnpj, telefone, pin })
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || 'Erro ao cadastrar.');
        return;
      }
      router.push('/dashboard');
    } catch {
      setErro('Falha de conexão. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight">
            OFIR <span className="text-gold">Pedidos</span>
          </h1>
          <p className="text-white/50 text-sm mt-1">Crie sua conta — 14 dias grátis</p>
        </div>

        <form onSubmit={cadastrar} className="space-y-4">
          <div>
            <label className="text-xs text-white/60 mb-1 block">Nome da empresa</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Lanchonete do João"
              className="w-full bg-navy2 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold transition"
            />
          </div>
          <div>
            <label className="text-xs text-white/60 mb-1 block">CNPJ</label>
            <input
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              placeholder="00.000.000/0000-00"
              inputMode="numeric"
              className="w-full bg-navy2 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold transition"
            />
          </div>
          <div>
            <label className="text-xs text-white/60 mb-1 block">WhatsApp (opcional)</label>
            <input
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(11) 90000-0000"
              inputMode="tel"
              className="w-full bg-navy2 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold transition"
            />
          </div>
          <div>
            <label className="text-xs text-white/60 mb-1 block">Crie um PIN de acesso</label>
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Mínimo 4 dígitos"
              type="password"
              inputMode="numeric"
              className="w-full bg-navy2 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold transition"
            />
          </div>

          {erro && <p className="text-red-400 text-sm">{erro}</p>}

          <button
            disabled={carregando}
            className="w-full bg-gold text-navy font-semibold rounded-xl py-3 mt-2 active:scale-[0.98] transition disabled:opacity-50"
          >
            {carregando ? 'Criando conta...' : 'Começar teste grátis'}
          </button>
        </form>

        <p className="text-center text-white/40 text-sm mt-6">
          Já tem conta?{' '}
          <Link href="/login" className="text-gold">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
