'use client';

import { useEffect, useState } from 'react';

export default function ConfiguracoesModal({ onFechar }: { onFechar: () => void }) {
  const [aceitarAutomatico, setAceitarAutomatico] = useState(true);
  const [largura, setLargura] = useState<'58mm' | '80mm'>('80mm');
  const [whatsappAtivo, setWhatsappAtivo] = useState(false);
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [tokenConfigurado, setTokenConfigurado] = useState(false);
  const [impressaoAtiva, setImpressaoAtiva] = useState(false);
  const [impressaoTokenConfigurado, setImpressaoTokenConfigurado] = useState(false);
  const [tokenGerado, setTokenGerado] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    fetch('/api/loja/configuracoes')
      .then((r) => r.json())
      .then((d) => {
        setAceitarAutomatico(d.aceitar_pedidos_automaticamente !== false);
        setLargura(d.largura_papel_impressao === '58mm' ? '58mm' : '80mm');
        setWhatsappAtivo(!!d.whatsapp_notificacoes_ativas);
        setPhoneNumberId(d.whatsapp_phone_number_id || '');
        setTokenConfigurado(!!d.whatsapp_token_configurado);
        setImpressaoAtiva(!!d.impressao_automatica_ativa);
        setImpressaoTokenConfigurado(!!d.impressao_token_configurado);
        setCarregando(false);
      });
  }, []);

  async function salvarCampo(campo: string, valor: unknown) {
    setSalvando(true);
    await fetch('/api/loja/configuracoes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [campo]: valor })
    });
    setSalvando(false);
  }

  async function alternarAceite() {
    const novo = !aceitarAutomatico;
    setAceitarAutomatico(novo);
    salvarCampo('aceitar_pedidos_automaticamente', novo);
  }

  async function alternarWhatsapp() {
    const novo = !whatsappAtivo;
    setWhatsappAtivo(novo);
    salvarCampo('whatsapp_notificacoes_ativas', novo);
  }

  async function alternarLargura(nova: '58mm' | '80mm') {
    setLargura(nova);
    salvarCampo('largura_papel_impressao', nova);
  }

  async function alternarImpressaoAutomatica() {
    const novo = !impressaoAtiva;
    setImpressaoAtiva(novo);
    salvarCampo('impressao_automatica_ativa', novo);
  }

  async function salvarCredenciaisWhatsapp() {
    setSalvando(true);
    await fetch('/api/loja/configuracoes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        whatsapp_phone_number_id: phoneNumberId,
        whatsapp_access_token: accessToken
      })
    });
    if (accessToken) setTokenConfigurado(true);
    setAccessToken('');
    setSalvando(false);
  }

  async function gerarTokenImpressao() {
    setSalvando(true);
    const res = await fetch('/api/impressao/token', { method: 'POST' });
    setSalvando(false);
    if (res.ok) {
      const data = await res.json();
      setTokenGerado(data.token);
      setImpressaoTokenConfigurado(true);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-30 flex items-end sm:items-center justify-center">
      <div className="bg-navy2 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg">Configurações</h2>
          <button onClick={onFechar} className="text-white/50 text-xl leading-none px-2">
            ×
          </button>
        </div>

        {carregando ? (
          <p className="text-white/40 text-sm py-8 text-center">Carregando...</p>
        ) : (
          <div className="space-y-4">
            <div className="bg-navy border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="pr-4">
                  <p className="text-sm font-medium">Aceitar pedidos do iFood automaticamente</p>
                  <p className="text-xs text-white/40 mt-1">
                    Sem isso, o pedido cancela sozinho se ninguém confirmar em até 8 minutos.
                  </p>
                </div>
                <button
                  onClick={alternarAceite}
                  disabled={salvando}
                  className={`shrink-0 w-12 h-7 rounded-full transition relative ${
                    aceitarAutomatico ? 'bg-gold' : 'bg-white/15'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-5 h-5 rounded-full bg-navy2 transition ${
                      aceitarAutomatico ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="bg-navy border border-white/10 rounded-xl p-4">
              <p className="text-sm font-medium mb-3">Impressão térmica</p>
              <p className="text-xs text-white/40 mb-2">Tamanho do papel</p>
              <div className="flex gap-2 mb-4">
                {(['58mm', '80mm'] as const).map((op) => (
                  <button
                    key={op}
                    onClick={() => alternarLargura(op)}
                    className={`flex-1 rounded-lg py-2 text-xs border transition ${
                      largura === op ? 'bg-gold text-navy border-gold font-semibold' : 'border-white/15 text-white/60'
                    }`}
                  >
                    {op}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Impressão automática (agente local)</p>
                <button
                  onClick={alternarImpressaoAutomatica}
                  disabled={salvando}
                  className={`shrink-0 w-12 h-7 rounded-full transition relative ${
                    impressaoAtiva ? 'bg-gold' : 'bg-white/15'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-5 h-5 rounded-full bg-navy2 transition ${
                      impressaoAtiva ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-white/40 mb-3">
                Sem mensalidade: pedidos vão pra uma fila que um programinha instalado no
                computador da loja consulta sozinho e manda pra impressora. Veja o passo a passo
                no LEIA-ME (pasta agente-impressora).
              </p>

              {tokenGerado ? (
                <div className="bg-navy2 border border-gold/40 rounded-lg p-3">
                  <p className="text-xs text-gold mb-1">Código do agente (copie agora, só aparece uma vez):</p>
                  <p className="text-xs break-all font-mono bg-navy px-2 py-1.5 rounded">{tokenGerado}</p>
                </div>
              ) : (
                <button
                  onClick={gerarTokenImpressao}
                  disabled={salvando}
                  className="w-full bg-white/10 rounded-lg py-2 text-xs font-medium disabled:opacity-50"
                >
                  {impressaoTokenConfigurado ? 'Gerar novo código (invalida o anterior)' : 'Gerar código do agente'}
                </button>
              )}
            </div>

            <div className="bg-navy border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium">Avisar cliente por WhatsApp</p>
                <button
                  onClick={alternarWhatsapp}
                  disabled={salvando || !tokenConfigurado}
                  className={`shrink-0 w-12 h-7 rounded-full transition relative disabled:opacity-30 ${
                    whatsappAtivo ? 'bg-gold' : 'bg-white/15'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-5 h-5 rounded-full bg-navy2 transition ${
                      whatsappAtivo ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-white/40 mb-3">
                Manda mensagem automática pro cliente a cada mudança de status (só pedidos de
                balcão/entrega própria com telefone informado).
              </p>
              <input
                value={phoneNumberId}
                onChange={(e) => setPhoneNumberId(e.target.value)}
                placeholder="Phone Number ID (Meta)"
                className="w-full bg-navy2 border border-white/10 rounded-lg px-3 py-2 text-sm mb-2 outline-none focus:border-gold"
              />
              <input
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder={tokenConfigurado ? 'Token já salvo — cole um novo pra trocar' : 'Access Token (Meta)'}
                type="password"
                className="w-full bg-navy2 border border-white/10 rounded-lg px-3 py-2 text-sm mb-3 outline-none focus:border-gold"
              />
              <button
                onClick={salvarCredenciaisWhatsapp}
                disabled={salvando}
                className="w-full bg-white/10 rounded-lg py-2 text-xs font-medium disabled:opacity-50"
              >
                {salvando ? 'Salvando...' : 'Salvar credenciais'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
