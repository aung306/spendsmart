// src/app/api/budget/route.ts
import { NextResponse } from 'next/server';
import { query } from '../../../backend/db';

// GET: Retrieve name and amount from budget table for a given account_id
// Test using: http://localhost:3000/api/budget?account_id=[number]
// Get account_id from cookie and include it in request URL
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const accID = url.searchParams.get('account_id');

    if (!accID) {
      return NextResponse.json(
        { message: 'account_id is required' },
        { status: 400 } // Bad Request
      );
    }

    // get info from budget table using account_id
    const result = await query(
      'SELECT name, amount FROM budget WHERE account_id = ?',
      [accID]
    ) as Array<{ name: string; amount: number }>;

    if (result.length === 0) {
      return NextResponse.json(
        { message: `No budget found for account_id ${accID}` },
        { status: 404 } // Not Found
      );
    }

    // Returns all budgets as an array
    return NextResponse.json({
      account_id: accID,
      budgets: result, // this returns all budgets as an array
      count: result.length
    });
  } 
  catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      { 
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// POST: Create a new budget using account_id, name, and amount
export async function POST(req: Request) {
  try {
    const { account_id, name, amount } = await req.json();

    if (!account_id || !name || amount === undefined) {
      return NextResponse.json(
        { message: 'account_id, name, and amount are required.' },
        { status: 400 }
      );
    }

    // Check if the provided account_id exists in the accounts table
    const accountCheck = await query(
      'SELECT * FROM account WHERE account_id = ?',
      [account_id]
    ) as Array<{ account_id: number }>;

    if (accountCheck.length === 0) {
      return NextResponse.json(
        { message: `No account found with account_id ${account_id}` },
        { status: 404 }
      );
    }

    // Insert the new budget record and get insertID
    const result = await query(
      `INSERT INTO budget (account_id, name, amount) 
       VALUES (?, ?, ?)`,
      [account_id, name, amount]
    ) as { insertId: number };

    // Return the inserted budget's information.
    return NextResponse.json({
      message: 'Budget created successfully',
      account: {
        budget_id: result.insertId,
        account_id: account_id,
        name: name,
        amount: amount,
      },
    });
  } 
  catch (error) {
    console.error('Error creating budget:', error);
    return NextResponse.json(
      { 
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
