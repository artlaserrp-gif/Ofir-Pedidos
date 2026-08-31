import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { senha } = await req.json();
  const senhaCorreta = process.env.ADMIN_PASSWORD;

  if (!senhaCorreta) {
    return NextResponse.json({ erro: 'ADMIN_PASSWORD não configurada no servidor.' }, { status: 500 });
  }
  if (senha !== senhaCorreta) {
    return NextResponse.json({ erro: 'Senha incorreta.' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('ofir_admin', senhaCorreta, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 7 dias
  });
  return res;
}
