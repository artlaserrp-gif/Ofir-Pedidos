import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const lojaId = req.cookies.get('ofir_loja_id')?.value;
  if (!lojaId) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 });

  const form = await req.formData();
  const nome = form.get('nome') as string;
  const categoria = (form.get('categoria') as string) || null;
  const descricao = (form.get('descricao') as string) || null;
  const preco = Number(form.get('preco'));
  const ativo = form.get('ativo') !== 'false';
  const arquivo = form.get('imagem') as File | null;

  const db = supabaseAdmin();
  const atualizacao: Record<string, unknown> = { nome: nome?.trim(), categoria, descricao, preco, ativo };

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
    atualizacao.imagem_url = urlPublica.publicUrl;
  }

  const { data, error } = await db
    .from('produtos')
    .update(atualizacao)
    .eq('id', params.id)
    .eq('loja_id', lojaId)
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ erro: 'Produto não encontrado.' }, { status: 404 });
  return NextResponse.json({ ok: true, produto: data });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const lojaId = req.cookies.get('ofir_loja_id')?.value;
  if (!lojaId) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 });

  const db = supabaseAdmin();
  // exclusão suave — mantém histórico de pedidos antigos que referenciam o produto
  const { error } = await db.from('produtos').update({ ativo: false }).eq('id', params.id).eq('loja_id', lojaId);

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
