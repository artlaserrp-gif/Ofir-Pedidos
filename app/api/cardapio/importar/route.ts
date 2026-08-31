import { NextRequest, NextResponse } from 'next/server';

// Lê uma foto do cardápio físico e extrai nome + categoria + preço de cada
// item usando a API da Anthropic (Claude), com visão de imagem.
// Requer a variável de ambiente ANTHROPIC_API_KEY configurada na Vercel.

const PROMPT = `Você está vendo a foto de um cardápio de um restaurante/lanchonete/loja.
Extraia todos os itens visíveis com nome, categoria (se der pra identificar
pelo agrupamento do cardápio, senão null) e preço (número, sem "R$", use
ponto como separador decimal, ex: 32.90).

Responda APENAS com um JSON array, sem nenhum texto antes ou depois, sem
markdown, no formato exato:
[{"nome": "Nome do item", "categoria": "Categoria ou null", "preco": 00.00}]

Se algum preço estiver ilegível ou ausente, use 0. Ignore textos que não
sejam itens de cardápio (logotipo, slogans, endereço, etc).`;

export async function POST(req: NextRequest) {
  const lojaId = req.cookies.get('ofir_loja_id')?.value;
  if (!lojaId) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { erro: 'Configuração pendente: adicione ANTHROPIC_API_KEY nas variáveis de ambiente da Vercel.' },
      { status: 500 }
    );
  }

  const form = await req.formData();
  const arquivo = form.get('imagem') as File | null;
  if (!arquivo || arquivo.size === 0) {
    return NextResponse.json({ erro: 'Envie uma foto do cardápio.' }, { status: 400 });
  }

  const bytes = await arquivo.arrayBuffer();
  const base64 = Buffer.from(bytes).toString('base64');
  const mediaType = arquivo.type || 'image/jpeg';

  try {
    const resposta = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
              { type: 'text', text: PROMPT }
            ]
          }
        ]
      })
    });

    if (!resposta.ok) {
      const detalhe = await resposta.text();
      return NextResponse.json({ erro: 'Falha ao consultar a IA: ' + detalhe }, { status: 500 });
    }

    const data = await resposta.json();
    const texto = data.content?.map((b: any) => b.text || '').join('') || '';
    const limpo = texto.replace(/```json|```/g, '').trim();
    const match = limpo.match(/\[[\s\S]*\]/);

    if (!match) {
      return NextResponse.json({ erro: 'Não consegui identificar itens nessa foto. Tente uma foto mais nítida.' }, { status: 422 });
    }

    const itens = JSON.parse(match[0]);
    return NextResponse.json({ itens });
  } catch (e: any) {
    return NextResponse.json({ erro: 'Erro ao processar a imagem: ' + e.message }, { status: 500 });
  }
}
