import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "rentwise-ai-super-secret-key-2024"
);

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(
  token: string
): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: (payload.userId as string) || "",
      email: (payload.email as string) || "",
      role: (payload.role as string) || "",
    };
  } catch {
    return null;
  }
}

export function getTokenFromHeader(
  request: Request
): string | null {
  const auth = request.headers.get("authorization");
  if (auth && auth.startsWith("Bearer ")) {
    return auth.slice(7);
  }
  return null;
}