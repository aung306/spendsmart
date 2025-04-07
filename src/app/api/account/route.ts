import { NextResponse } from 'next/server';
import { query } from '../../../backend/db';  // Note the path has three dots, not two
import bcrypt from 'bcrypt';

// get first name, last name, and email provided the account_id
// test using http://localhost:3000/api/account?account_id=[number]
// make sure you add data to table before testing
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
  
    const result = await query('SELECT account_id, first_name, last_name, email FROM account WHERE account_id = $1', [accountId]);
  
    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: `No account found for account_id ${accountId}` },
        { status: 404 }
      );
    }
  
    return NextResponse.json({
      account_id: accountId,
      first_name: result.rows[0].first_name,
      last_name: result.rows[0].last_name,
      email: result.rows[0].email
    });
    
  } catch (error) {
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

  export async function POST(req: Request) {
    try {
      const {email, password, first_name, last_name} = await req.json();

      if (!email || !password) {
        return NextResponse.json(
          { message: 'Email, and password are required.' },
          { status: 400 } 
        );
      }

      const emailCheck = await query('SELECT * FROM account WHERE email = $1', [email]);
      if (emailCheck.rows.length > 0) {
        return NextResponse.json(
          { message: 'Email already exists.' },
          { status: 400 } 
        );
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await query(
        `INSERT INTO account (email, password, first_name, last_name) 
         VALUES ($1, $2, $3, $4) RETURNING account_id`,
        [email, hashedPassword, first_name, last_name]
      );

      return NextResponse.json({
        message: 'Account created successfully',
        account_id: result.rows[0].account_id,
      }, {status: 201});
  
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