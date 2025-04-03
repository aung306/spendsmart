// src/app/api/db-test/route.ts
import { NextResponse } from 'next/server';
import { query } from '../../../../backend/db'; 

// this hasn't been tested yet because of database table issues
// TODO: fix this issue when creating a new event "error": "insert or update on table \"events\" violates foreign key constraint \"events_account_id_fkey\""
export async function POST(req: Request) {
    try {
      const { account_id, event_name, occurrence, payment } = await req.json();
  
      if ( !account_id || !event_name || occurrence == undefined || payment === undefined) {
        return NextResponse.json(
          { message: 'account_id, event name, occurrence, and payment are required.' },
          { status: 400 } 
        );
      }
  
      const result = await query(
        `INSERT INTO events (account_id, event_name, occurrence, payment) 
         VALUES ($1, $2, $3, $4) RETURNING account_id, event_name, occurrence, payment`,
        [account_id, event_name, occurrence, payment]
      );
  
      return NextResponse.json({
        message: 'Event created successfully',
        account: result.rows[0],
      });
  
    } catch (error) {
      console.error('Error creating event:', error);
      return NextResponse.json(
        { message: 'Database connection failed',
          error: error instanceof Error ? error.message : String(error)},
        { status: 500 }
      );
    }
  }