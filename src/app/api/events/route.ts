// src/app/api/events/route.ts
import { NextResponse } from 'next/server';
import { query } from '../../../backend/db'; 

// POST /api/events
// Make events
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { budget_id, event_name, occurrence, payment, start_date, end_date } = body;
  
    if (!budget_id || !event_name || occurrence === undefined || payment === undefined || start_date === undefined || end_date === undefined) {
      return NextResponse.json(
        { message: 'budget_id, event_name, occurrence, start date, end date, and payment are required.' },
        { status: 400 }
      );
    }

    // Check if the budget exists since events are connected to budgets
    const budgetCheck = await query(
      'SELECT * FROM budget WHERE budget_id = ?',
      [budget_id]
    ) as Array<{event_id: number; budget_id: number; event_name: string; occurrence: number; payment: number, start_date: string; end_date: string}>;
    if (budgetCheck.length === 0) {
      return NextResponse.json(
        { message: `No budget found with budget_id ${budget_id}` },
        { status: 404 }
      );
    }

    // Check if an event with the same name already exists for this budget.
    const eventCheck = await query(
      'SELECT * FROM events WHERE event_name = ? AND budget_id = ?',
      [event_name, budget_id]
    ) as Array<{event_id: number; budget_id: number; event_name: string; occurrence: number; payment: number, start_date: string; end_date: string}>;
    if (eventCheck.length > 0) {
      return NextResponse.json(
        { message: `Event with name ${event_name} already exists for the given budget` },
        { status: 409 }
      );
    }
  
    // Insert the new event and return insertID
    const result = await query(
      `INSERT INTO events (budget_id, event_name, occurrence, payment, start_date, end_date) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [budget_id, event_name, occurrence, payment, start_date, end_date]
    ) as { insertId: number };
  
    // Set up the inserted event object.
    const insertedEvent = {
      event_id: result.insertId,
      budget_id,
      event_name,
      occurrence,
      payment,
      start_date,
      end_date
    };

    return NextResponse.json({
      message: 'Event created successfully',
      event: insertedEvent
    });
  
  } 
  catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { 
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
  
// GET /api/events?account_id=[account_id]
// This endpoint retrieves events for a given account by joining the budgets and events tables.
// Look for events associated with a budget
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
    
    // Check if the account exists.
    const accountCheck = await query(
      'SELECT * FROM account WHERE account_id = ?',
      [account_id]
    ) as Array<{event_id: number; budget_id: number; event_name: string; occurrence: number; payment: number, start_date: string; end_date: string}>;
    if (accountCheck.length === 0) {
      return NextResponse.json(
        { message: `No account found with account_id ${account_id}` },
        { status: 404 }
      );
    }
    
    // Fetch events belonging to budgets for this account
    // Join the events table with the budget table on budget_id,
    // then filter by the provided account_id to get event for the budget of that person.
    const events = await query(
      `SELECT e.event_id, e.budget_id, e.event_name, e.occurrence, e.payment, e.start_date, e.end_date
       FROM events e
       JOIN budget b ON e.budget_id = b.budget_id
       WHERE b.account_id = ?`,
      [account_id]
    ) as Array<{ event_id: number; budget_id: number; event_name: string; occurrence: number; payment: number, start_date: string; end_date: string}>;
    
    return NextResponse.json({
      message: 'Events retrieved successfully',
      events: events,
      count: events.length
    });
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
