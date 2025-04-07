import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '../../../../backend/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secure-jwt-secret-key';

export async function POST(req: Request) {
  try {
    const { refreshToken } = await req.json();
    
    if (!refreshToken) {
      return NextResponse.json(
        { message: 'Refresh token is required' },
        { status: 400 }
      );
    }
    
    // Verify the refresh token
    let payload;
    try { payload = jwt.verify(refreshToken, JWT_SECRET) as { userId: string }; } 
    catch (error) {
      return NextResponse.json(
        { message: 'Invalid refresh token' },
        { status: 401 }
      );
    }
    
    // Get user information
    const result = await query(
      'SELECT account_id, email FROM account WHERE account_id = $1',
      [payload.userId]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    const user = result.rows[0];
    // Generate a new access token
    const accessToken = jwt.sign(
      { 
        userId: user.account_id,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    return NextResponse.json({ accessToken });
    
  } 
  catch (error) {
    console.error('Token refresh error:', error);
    
    return NextResponse.json(
      { 
        message: 'Token refresh failed',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}