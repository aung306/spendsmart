import { NextResponse } from 'next/server';
import { query } from '../../../backend/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secure-jwt-secret-key';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    const result = await query(
      'SELECT account_id, email, password, first_name, last_name FROM account WHERE email = ?',
      [email]
    ) as Array<{ account_id: number; email: string; password: string; first_name: string; last_name: string; }> ;
    
    // User not found
    if (result.length === 0) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    const user = result[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Generate access token (short-lived)
    const accessToken = jwt.sign(
      { 
        userId: user.account_id,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: '1h' } // Token expires in 1 hour
    );
    
    // Generate refresh token
    const refreshToken = jwt.sign(
      { userId: user.account_id },
      JWT_SECRET,
      { expiresIn: '7d' } // Refresh token expires in 7 days
    );

    //Set cookies for access and refresh tokens
    const cookieStore = await cookies();

    cookieStore.set({
      name: 'accessToken',
      value: accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'strict',
      maxAge: 60 * 60 // 1 hour
    });

    cookieStore.set({
      name: 'refreshToken',
      value: refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    // Return tokens and user info
    return NextResponse.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user.account_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      }
    });
    
  } 
  catch (error) {
    console.error('Login error:', error);
    
    return NextResponse.json(
      { 
        message: 'Authentication failed',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}