import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const lojaId = req.cookies.get('ofir_loja_id')?.value;
  if (!lojaId) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 });

  const db = supabaseAdmin();
  const { data, error } = await db
    .from('produtos')
    .select('*')
    .eq('loja_id', lojaId)
    .order('categoria')
    .order('nome');

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ produtos: data });
}

export async function POST(req: NextRequest) {
  const lojaId = req.cookies.get('ofir_loja_id')?.value;
  if (!lojaId) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 });

  const form = await req.formData();
  const nome = form.get('nome') as string;
  const categoria = (form.get('categoria') as string) || null;
  const descricao = (form.get('descricao') as string) || null;
  const preco = Number(form.get('preco'));
  const arquivo = form.get('imagem') as File | null;

  if (!nome?.trim() || !preco) {
    return NextResponse.json({ erro: 'Nome e preço são obrigatórios.' }, { status: 400 });
  }

  const db = supabaseAdmin();
  let imagem_url: string | null = null;

  if (arquivo && arquivo.size > 0) {
    const extensao = arquivo.name.split('.').pop() || 'jpg';
    const caminho = `${lojaId}/${crypto.randomUUID()}.${extensao}`;
    const bytes = await arquivo.arrayBuffer();

    const { error: erroUpload } = await db.storage
      .from('produtos')
      .upload(caminho, bytes, { contentType: arquivo.type, upsert: false });

    if (erroUpload) {
      return NextResponse.json({ erro: 'Falha ao enviar a foto: ' + erroUpload.message }, { status: 500 });
    }

    const { data: urlPublica } = db.storage.from('produtos').getPublicUrl(caminho);
    imagem_url = urlPublica.publicUrl;
  }

  const { data, error } = await db
    .from('produtos')
    .insert({ loja_id: lojaId, nome: nome.trim(), categoria, descricao, preco, imagem_url })
    .select()
    .single();

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, produto: data });
}
