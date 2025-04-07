import { NextResponse } from 'next/server';
import { query } from '../../../backend/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

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
      'SELECT account_id, email, password, first_name, last_name FROM account WHERE email = $1',
      [email]
    );
    
    // User not found
    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Removed duplicate declaration of accessToken
    
    const user = result.rows[0];
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
    
  } catch (error) {
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