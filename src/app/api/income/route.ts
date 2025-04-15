// src/app/api/income/route.ts
import { NextResponse } from 'next/server';
import { query } from '../../../backend/db';

// Define interfaces based on schema
interface Account {
  account_id: number;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

interface Income {
  account_id: number;
  name: string;
  amount: number;
  occurrence: string;
}

// GET /api/income?account_id=[account_id]
// Fetch income records for a specific account
// Get the account_id from cookie and put in request URL
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const account_id = url.searchParams.get('account_id');
    
    if (!account_id) {
      return NextResponse.json(
        { message: 'account_id is required' },
        { status: 400 }
      );
    }
    
    const accountCheck = await query<Account[]>(
      'SELECT * FROM account WHERE account_id = ?',
      [account_id]
    );
    
    if (accountCheck.length === 0) {
      return NextResponse.json(
        { message: `No account found with account_id ${account_id}` },
        { status: 404 }
      );
    }
    
    // Fetch income records for the specified account
    const incomes = await query<Income[]>(
      'SELECT * FROM income WHERE account_id = ?',
      [account_id]
    );
    
    return NextResponse.json(incomes);
    
  } 
  catch (error) {
    console.error('Error fetching income:', error);
    return NextResponse.json(
      { 
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// POST /api/income
// Make new income for account
export async function POST(req: Request) {
  try {
    const { account_id, name, amount, occurrence } = await req.json();
  
    if (!account_id || !name || amount === undefined || occurrence === undefined ) {
      return NextResponse.json(
        { message: 'account_id, name, amount, and occurrence are required.' },
        { status: 400 } 
      );
    }
    
    const accountCheck = await query<Account[]>(
      'SELECT * FROM account WHERE account_id = ?',
      [account_id]
    );
    
    if (accountCheck.length === 0) {
      return NextResponse.json(
        { message: `No account found with account_id ${account_id}` },
        { status: 404 }
      );
    }
    
    // Check if an income record with the same name already exists.
    // Name is unique since it is a primary key
    const incomeCheck = await query<Income[]>(
      'SELECT * FROM income WHERE name = ?',
      [name]
    );
    
    if (incomeCheck.length > 0) {
      return NextResponse.json(
        { message: `Income record with name ${name} already exists` },
        { status: 409 }
      );
    }
  
    // Insert the new income record and return insertID
    await query(
      `INSERT INTO income (account_id, name, amount, occurrence) 
       VALUES (?, ?, ?, ?)`,
      [account_id, name, amount, occurrence]
    );
  
    return NextResponse.json({
      message: 'Income created successfully',
      income: { account_id, name, amount, occurrence }
    });
  
  } 
  catch (error) {
    console.error('Error creating income:', error);
    return NextResponse.json(
      { 
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
