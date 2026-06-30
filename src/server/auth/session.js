import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/server/db/prisma";
import { unauthenticated } from "@/server/http/errors";

export const SESSION_COOKIE = "campuspulse_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function secretKey() {
  const secret = process.env.SESSION_SECRET || "campuspulse-development-secret-change-me";
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(user) {
  return new SignJWT({
    sub: user.id,
    role: user.role,
    email: user.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey());
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

export async function readSessionPayload() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload;
  } catch {
    return null;
  }
}

export async function getSessionUser() {
  const payload = await readSessionPayload();
  if (!payload?.sub) return null;

  return prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      interests: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw unauthenticated();
  return user;
}
