import { NextResponse } from 'next/server';
import { query } from '../../../backend/db'; 

// this hasn't been tested yet because of database table issues
export async function POST(req: Request) {
    try {
      const { account_id, event_names, occurrence, payment } = await req.json();
  
      if ( !account_id || !event_names || occurrence == undefined || payment === undefined) {
        return NextResponse.json(
          { message: 'account_id, event name, occurrence, and payment are required.' },
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

      const eventCheck = await query('SELECT * FROM events WHERE event_names = $1', [event_names]);
      if (eventCheck.rows.length > 0) {
        return NextResponse.json(
          { message: `Event with name ${event_names} already exists` },
          { status: 409 }
        );
      }
  
      const result = await query(
        `INSERT INTO events (account_id, event_names, occurrence, payment) 
         VALUES ($1, $2, $3, $4) RETURNING account_id, event_names, occurrence, payment`,
        [account_id, event_names, occurrence, payment]
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