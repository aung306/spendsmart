// src/app/api/account/route.ts
import { NextResponse } from 'next/server';
import { query } from '../../../backend/db';
import bcrypt from 'bcrypt';

// GET: Retrieve first name, last name, and email for the given account_id
// Test using: http://localhost:3000/api/account?account_id=[number]
// For frontend, get account_id from cookie and put it in request url
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const accountId = url.searchParams.get('account_id');

    if (!accountId) {
      return NextResponse.json(
        { message: 'Account ID is required' },
        { status: 400 }
      );
    }

    const result: { account_id: number; first_name: string; last_name: string; email: string }[] = await query(
      'SELECT account_id, first_name, last_name, email FROM account WHERE account_id = ?',
      [accountId]
    );

    // Check if account is returned from database
    if (!result || result.length === 0) {
      return NextResponse.json(
        { message: `No account found for account_id ${accountId}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      account_id: result[0].account_id,
      first_name: result[0].first_name,
      last_name: result[0].last_name,
      email: result[0].email
    });
  } 
  catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      {
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// POST: Create a new account
export async function POST(req: Request) {
  try {
    const { email, password, first_name, last_name } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required.' },
        { status: 400 }
      );
    }

    // Check if the email already exists
    const emailCheck: { email: string }[] = await query('SELECT * FROM account WHERE email = ?', [email]);
    if (emailCheck && emailCheck.length > 0) {
      return NextResponse.json(
        { message: 'Email already exists.' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await query<{ insertId: number }>(
      `INSERT INTO account (email, password, first_name, last_name) 
       VALUES (?, ?, ?, ?)`,
      [email, hashedPassword, first_name, last_name]
    );

    // Successful insertion makes insertId available for record
    return NextResponse.json({
      message: 'Account created successfully',
      account_id: result.insertId
    }, { status: 201 });
  
  } 
  catch (error) {
    console.error('Error creating account:', error);
    return NextResponse.json(
      {
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
