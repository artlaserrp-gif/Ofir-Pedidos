import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const lojaId = req.cookies.get('ofir_loja_id')?.value;
  if (!lojaId) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 });

  const form = await req.formData();
  const arquivo = form.get('logo') as File | null;
  if (!arquivo || arquivo.size === 0) {
    return NextResponse.json({ erro: 'Envie uma imagem.' }, { status: 400 });
  }

  const db = supabaseAdmin();
  const extensao = arquivo.name.split('.').pop() || 'png';
  const caminho = `logos/${lojaId}-${Date.now()}.${extensao}`;
  const bytes = await arquivo.arrayBuffer();

  const { error: erroUpload } = await db.storage
    .from('produtos')
    .upload(caminho, bytes, { contentType: arquivo.type, upsert: false });

  if (erroUpload) {
    return NextResponse.json({ erro: 'Falha ao enviar a logo: ' + erroUpload.message }, { status: 500 });
  }

  const { data: urlPublica } = db.storage.from('produtos').getPublicUrl(caminho);

  const { error } = await db.from('lojas').update({ logo_url: urlPublica.publicUrl }).eq('id', lojaId);
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, logo_url: urlPublica.publicUrl });
}
