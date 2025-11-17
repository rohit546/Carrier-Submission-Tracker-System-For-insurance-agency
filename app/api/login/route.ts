import { NextRequest, NextResponse } from 'next/server';
import { login, setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    
    const result = await login(username, password);
    
    if (!result) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    await setAuthCookie(result.userId, result.role);
    
    return NextResponse.json({ success: true, role: result.role });
  } catch (error) {
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
