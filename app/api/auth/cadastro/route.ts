import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { nome, cnpj, telefone, pin } = await req.json();

  if (!nome?.trim() || !cnpj?.trim() || !pin?.trim()) {
    return NextResponse.json({ erro: 'Preencha nome da empresa, CNPJ e PIN.' }, { status: 400 });
  }
  if (pin.length < 4) {
    return NextResponse.json({ erro: 'O PIN precisa ter ao menos 4 dígitos.' }, { status: 400 });
  }

  const cnpjLimpo = cnpj.replace(/\D/g, '');
  if (cnpjLimpo.length !== 14) {
    return NextResponse.json({ erro: 'CNPJ inválido.' }, { status: 400 });
  }

  const db = supabaseAdmin();

  const { data: existente } = await db.from('lojas').select('id').eq('cnpj', cnpjLimpo).maybeSingle();
  if (existente) {
    return NextResponse.json({ erro: 'Já existe uma empresa cadastrada com esse CNPJ.' }, { status: 409 });
  }

  const trialExpiraEm = new Date();
  trialExpiraEm.setDate(trialExpiraEm.getDate() + 14);

  const slugBase = nome
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  let slug = slugBase || 'loja';
  let sufixo = 0;
  while (true) {
    const { data: existeSlug } = await db.from('lojas').select('id').eq('slug', slug).maybeSingle();
    if (!existeSlug) break;
    sufixo += 1;
    slug = `${slugBase}-${sufixo}`;
  }

  const { data: loja, error } = await db
    .from('lojas')
    .insert({
      nome: nome.trim(),
      cnpj: cnpjLimpo,
      telefone: telefone?.trim() || null,
      pin,
      plano: 'trial',
      ativo: true,
      trial_expira_em: trialExpiraEm.toISOString(),
      slug
    })
    .select()
    .single();

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  const res = NextResponse.json({ ok: true, loja: { id: loja.id, nome: loja.nome } });
  res.cookies.set('ofir_loja_id', loja.id, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30
  });
  return res;
}
