import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { getUserByUsername } from './db';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'mckinney-secret-key-2024');

export async function signToken(userId: string, role: string): Promise<string> {
  return await new SignJWT({ userId, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET_KEY);
}

export async function verifyToken(token: string): Promise<{ userId: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return { userId: payload.userId as string, role: payload.role as string };
  } catch {
    return null;
  }
}

export async function login(username: string, password: string): Promise<{ userId: string; role: string; name: string } | null> {
  const user = await getUserByUsername(username);
  if (!user) return null;
  
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return null;
  
  return { userId: user.id, role: user.role, name: user.name };
}

export async function getCurrentUser(): Promise<{ userId: string; role: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  
  if (!token) return null;
  
  return await verifyToken(token);
}

export async function setAuthCookie(userId: string, role: string): Promise<void> {
  const token = await signToken(userId, role);
  const cookieStore = await cookies();
  cookieStore.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('token');
}