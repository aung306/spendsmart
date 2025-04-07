import { NextResponse } from 'next/server';
import { query } from '../../../backend/db'; 

// GET /api/income
// http://localhost:3000/api/income?account_id=?{account_id}
export async function GET(req: Request) {
  try{
    const url = new URL(req.url);
    const account_id = url.searchParams.get('account_id');

    if (account_id) {
      const accountCheck = await query('SELECT * FROM account WHERE account_id = $1', [account_id]);
      if (accountCheck.rows.length === 0) {
        return NextResponse.json(
          { message: `No account found with account_id ${account_id}` },
          { status: 404 }
        );
      }

      const events = await query('SELECT * FROM income WHERE account_id = $1', [account_id]);

      return NextResponse.json(events.rows);
    }
  }
  catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { message: 'Database connection failed',
        error: error instanceof Error ? error.message : String(error)},
      { status: 500 }
    );
  }

}

// POST /api/income
export async function POST(req: Request) {
  try {
    const { account_id, name, amount, occurrence } = await req.json();
  
    if ( !account_id || !name || amount == undefined || occurrence === undefined) {
      return NextResponse.json(
        { message: 'account_id, name, amount, and occurrence are required.' },
        { status: 400 } 
      );
    }

    const accountCheck = await query('SELECT * FROM account WHERE account_id = $1', [account_id]);
    if (accountCheck.rows.length === 0) {
      return NextResponse.json(
        { message: `No account found with account_id ${account_id}` },
        { status: 404 }
      );
    }

    const eventCheck = await query('SELECT * FROM income WHERE name = $1', [name]);
    if (eventCheck.rows.length > 0) {
      return NextResponse.json(
        { message: `Event with name ${name} already exists` },
        { status: 409 }
      );
    }
  
    const result = await query(
      `INSERT INTO income (account_id, name, amount, occurrence) 
      VALUES ($1, $2, $3, $4) RETURNING account_id, name, amount, occurrence`,
      [account_id, name, amount, occurrence]
    );
  
    return NextResponse.json({
      message: 'Event created successfully',
      account: result.rows[0],
    });
  
  } 
  catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { message: 'Database connection failed',
        error: error instanceof Error ? error.message : String(error)},
      { status: 500 }
    );
  }
}