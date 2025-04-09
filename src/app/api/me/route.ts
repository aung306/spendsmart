// src/app/api/me/route.ts
import { NextResponse } from 'next/server';
import { query } from '../../../backend/db';
import { cookies } from 'next/headers';
import { verifyToken } from '../../../middleware/auth'; // Adjust the import path as necessary

export async function GET() {
  try {
    // Get the access token from cookies
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
    
    if (!accessToken) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const payload = verifyToken(accessToken);
    console.log('Payload:', payload);

    if (!payload) {
      return NextResponse.json(
        { authenticated: false, message: 'Invalid token' },
        { status: 401 }
      );
    }
    
    // Fetch user details from database
    const userResult = await query(
      'SELECT account_id, first_name, last_name, email FROM account WHERE account_id = $1',
      [payload.userId]
    );
    
    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { authenticated: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Return user information
    return NextResponse.json({
      authenticated: true,
      user: userResult.rows[0]
    });
  } 
  catch (error) {
    console.error('Error getting current user:', error);
    return NextResponse.json(
      { 
        authenticated: false,
        message: 'Error retrieving user information'
      },
      { status: 500 }
    );
  }
}