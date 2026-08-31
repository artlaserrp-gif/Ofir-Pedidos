'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senha })
    });
    setCarregando(false);
    if (!res.ok) {
      const data = await res.json();
      setErro(data.erro || 'Erro ao entrar.');
      return;
    }
    router.push('/admin');
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={entrar} className="w-full max-w-xs">
        <h1 className="text-center font-bold text-lg mb-6">
          OFIR <span className="text-gold">Admin</span>
        </h1>
        <input
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          type="password"
          placeholder="Senha de administrador"
          className="w-full bg-navy2 border border-white/10 rounded-xl px-4 py-3 mb-3 outline-none focus:border-gold"
        />
        {erro && <p className="text-red-400 text-sm mb-3">{erro}</p>}
        <button
          disabled={carregando}
          className="w-full bg-gold text-navy font-semibold rounded-xl py-3 disabled:opacity-50"
        >
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
