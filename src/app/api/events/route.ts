import { NextResponse } from 'next/server';
import { query } from '../../../backend/db'; 

//http://localhost:3000/api/events
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { account_id, event_name, occurrence, payment } = body;
  
    if ( !account_id || !event_name || occurrence == undefined || payment === undefined) {
      return NextResponse.json(
        { message: 'account_id, event names, occurrence, and payment are required.' },
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

    const eventCheck = await query('SELECT * FROM events WHERE event_names = $1', [event_name]);
    if (eventCheck.rows.length > 0) {
      return NextResponse.json(
        { message: `Event with name ${event_name} already exists` },
        { status: 409 }
      );
    }
  
    const result = await query(
      `INSERT INTO events (account_id, event_names, occurrence, payment) 
       VALUES ($1, $2, $3, $4) RETURNING account_id, event_names, occurrence, payment`,
      [account_id, event_name, occurrence, payment]
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

// http://localhost:3000/api/events?account_id=?{account_id}
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const account_id = url.searchParams.get('account_id');
    
    if (account_id) {
      //check if the account exists
      const accountCheck = await query('SELECT * FROM account WHERE account_id = $1', [account_id]);
      if (accountCheck.rows.length === 0) {
        return NextResponse.json(
          { message: `No account found with account_id ${account_id}` },
          { status: 404 }
        );
      }
      
      //fetch events for the specified account
      const events = await query(
        'SELECT * FROM events WHERE account_id = $1',
        [account_id]
      );
      
      return NextResponse.json({
        message: 'Events retrieved successfully',
        events: events.rows,
        count: events.rows.length
      });
    } 
    else{
      return NextResponse.json(
        { message: 'account_id is required' },
        { status: 400 }
      );
    }
  } 
  catch (error) {
    console.error('Error retrieving events:', error);
    return NextResponse.json(
      { 
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}