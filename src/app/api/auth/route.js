import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, setSessionCookie, clearSessionCookie } from "@/lib/auth";

export async function POST(request) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password are required." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { username } });
  const passwordIsValid = user && (await verifyPassword(password, user.passwordHash));

  if (!passwordIsValid) {
    return NextResponse.json(
      { error: "Incorrect username or password." },
      { status: 401 }
    );
  }

  await setSessionCookie(user.id);
  return NextResponse.json({ username: user.username });
}

export async function DELETE() {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
