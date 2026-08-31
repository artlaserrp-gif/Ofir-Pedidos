import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const lojaId = req.cookies.get('ofir_loja_id')?.value;
  if (!lojaId) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 });

  const { itens } = await req.json();
  if (!Array.isArray(itens) || itens.length === 0) {
    return NextResponse.json({ erro: 'Nenhum item para salvar.' }, { status: 400 });
  }

  const db = supabaseAdmin();
  const paraInserir = itens
    .filter((i: any) => i.nome?.trim())
    .map((i: any) => ({
      loja_id: lojaId,
      nome: i.nome.trim(),
      categoria: i.categoria?.trim() || null,
      preco: Number(i.preco) || 0,
      ativo: true
    }));

  const { data, error } = await db.from('produtos').insert(paraInserir).select();

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, quantidade: data.length });
}
