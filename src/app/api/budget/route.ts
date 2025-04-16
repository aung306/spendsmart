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
        { status: 400 } 
      );
    }

    const result = await query(
      'SELECT budget_id, name, amount, allocation FROM budget WHERE account_id = ?',
      [accID]
    ) as Array<{ budget_id: number; name: string; amount: number, allocation: number }>;

    // if (result.length === 0) {
    //   return NextResponse.json(
    //     { message: `No budget found for account_id ${accID}` },
    //     { status: 404 } 
    //   );
    // }

    // Returns all budgets as an array
    return NextResponse.json({
      account_id: accID,
      budgets: result, 
      count: result.length,
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
    const { account_id, name, amount, allocation } = await req.json();
    console.log("payload: ", account_id, name, amount, allocation);

    if (!account_id || !name || amount === undefined || allocation === undefined) {
      return NextResponse.json(
        { message: 'account_id, name, allocation, and amount are required.' },
        { status: 400 }
      );
    }

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

    const result = await query(
      `INSERT INTO budget (account_id, name, amount, allocation) 
       VALUES (?, ?, ?, ?)`,
      [account_id, name, amount, allocation]
    ) as { insertId: number };

    return NextResponse.json({
      message: 'Budget created successfully',
      account: {
        budget_id: result.insertId,
        account_id: account_id,
        name: name,
        amount: amount,
        allocation: allocation,
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

interface DeleteResult {
  affectedRows: number;
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const budgetId = url.searchParams.get('budget_id');

    if (!budgetId) {
      return NextResponse.json(
        { message: 'budget_id is required.' },
        { status: 400 }
      );
    }

    const result = await query<DeleteResult>(
      'DELETE FROM budget WHERE budget_id = ?',
      [budgetId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { message: `No budget found with id ${budgetId}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: `Budget with id ${budgetId} deleted successfully.`,
    });
  } catch (error) {
    console.error('Error deleting budget:', error);
    return NextResponse.json(
      {
        message: 'Failed to delete budget.',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
