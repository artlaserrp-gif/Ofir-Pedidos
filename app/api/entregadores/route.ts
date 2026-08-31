import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const lojaId = req.cookies.get('ofir_loja_id')?.value;
  if (!lojaId) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 });

  const db = supabaseAdmin();
  const { data, error } = await db
    .from('entregadores')
    .select('id, nome, telefone, ativo')
    .eq('loja_id', lojaId)
    .eq('ativo', true)
    .order('nome');

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ entregadores: data });
}

export async function POST(req: NextRequest) {
  const lojaId = req.cookies.get('ofir_loja_id')?.value;
  if (!lojaId) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 });

  const { nome, telefone } = await req.json();
  if (!nome?.trim()) return NextResponse.json({ erro: 'Nome é obrigatório.' }, { status: 400 });

  const db = supabaseAdmin();
  const { data, error } = await db
    .from('entregadores')
    .insert({ loja_id: lojaId, nome: nome.trim(), telefone: telefone?.trim() || null })
    .select()
    .single();

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, entregador: data });
}
