import crypto from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./db";

export const SESSION_COOKIE_NAME = "session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  throw new Error("SESSION_SECRET is not set. Add it to your .env file.");
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

function sign(payload) {
  return crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
}

// A session cookie is "<userId>.<expiresAt>.<signature>". The signature proves
// the cookie was issued by this server and hasn't been tampered with, without
// needing a database table to track sessions.
export function createSessionToken(userId) {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `${userId}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [userId, expiresAt, signature] = parts;
  const expectedSignature = sign(`${userId}.${expiresAt}`);

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (signatureBuffer.length !== expectedBuffer.length) return null;
  if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) return null;

  if (Date.now() > Number(expiresAt)) return null;

  return Number(userId);
}

export async function setSessionCookie(userId) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, createSessionToken(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// Reads the session cookie and returns the logged-in user (without their
// password hash), or null if no one is logged in.
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const userId = verifySessionToken(token);
  if (!userId) return null;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  const { passwordHash: _passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
