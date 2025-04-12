// src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  
  // clear cookies
  cookieStore.delete('accessToken');
  cookieStore.delete('refreshToken');
  
  // Return success response
  return NextResponse.json({
    success: true,
    message: 'Logged out successfully'
  });
}