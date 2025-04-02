// src/app/api/db-test/route.ts
import { NextResponse } from 'next/server';
import { query } from '../../../../backend/db';  // Note the path has three dots, not two

// get name and amount from budget table with account id provided
// test using http://localhost:3000/api/db-test/budget?account_id=[number]
// make sure you add data to table before testing
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const accID = url.searchParams.get('account_id');

    if (!accID){
        return NextResponse.json(
            {message: 'account_id is required'},
            {status: 400} //bad request 
        )
    }

    const result = await query('SELECT name, amount FROM budget WHERE account_id = $1', [accID]);

    if(result.rows.length === 0){
        return NextResponse.json(
            { message: `No budget found for account_id ${accID}` },
            { status: 404 }, // Not Found);
        );
    }

    return NextResponse.json({
        account_id: accID,
        name: result.rows[0].name,
        amount: result.rows[0].amount,
      });

    
  } catch (error) {
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

// haven't test this yet 
export async function POST(req: Request) {
  try {
    const { name, amount } = await req.json();

    if ( !name || amount === undefined) {
      return NextResponse.json(
        { message: 'name, and amount are required.' },
        { status: 400 } 
      );
    }

    const result = await query(
      `INSERT INTO budget (name, amount) 
       VALUES ($1, $2, $3) RETURNING account_id, name, amount`,
      [name, amount]
    );

    return NextResponse.json({
      message: 'Account created successfully',
      account: result.rows[0],
    });

  } catch (error) {
    console.error('Error creating account:', error);
    return NextResponse.json(
      { message: 'Database connection failed',
        error: error instanceof Error ? error.message : String(error)},
      { status: 500 }
    );
  }
}
