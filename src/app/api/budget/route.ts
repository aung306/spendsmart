import { NextResponse } from 'next/server';
import { query } from '../../../backend/db';  // Note the path has three dots, not two

// get name and amount from budget table with account id provided
// test using http://localhost:3000/api/budget?account_id=[number]
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
    //Unsure whether you can have multiple budgets, but if not ignore this but if you want
    //Uncomment this here to return multiple budgets
    // if(result.rows.length > 1) {
    //   return NextResponse.json({
    //     account_id: accID,
    //     budgets: result.rows
    //   });
    // }

    return NextResponse.json({
      account_id: accID,
      name: result.rows[0].name,
      amount: result.rows[0].amount,
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

// creates a new budget using account id, name, and account
// test using postman and raw JSON body
export async function POST(req: Request) {
  try {
    const { account_id, name, amount } = await req.json();

    if ( !account_id || !name || amount === undefined) {
      return NextResponse.json(
        { message: 'account_id, name, and amount are required.' },
        { status: 400 } 
      );
    }

    // Check if the account_id exists in the accounts table
    const accountCheck = await query('SELECT * FROM account WHERE account_id = $1', [account_id]);
    if (accountCheck.rows.length === 0) {
      return NextResponse.json(
        { message: `No account found with account_id ${account_id}` },
        { status: 404 }
      );
    }

    const result = await query(
      `INSERT INTO budget (account_id, name, amount) 
       VALUES ($1, $2, $3) RETURNING account_id, name, amount`,
      [account_id, name, amount]
    );

    return NextResponse.json({
      message: 'Budget created successfully',
      account: result.rows[0],
    });

  } 
  catch (error) {
    console.error('Error creating budget:', error);
    return NextResponse.json(
      { message: 'Database connection failed', error: error instanceof Error ? error.message : String(error)},
      { status: 500 }
    );
  }
}
