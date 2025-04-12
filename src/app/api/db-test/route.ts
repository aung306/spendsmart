// src/app/api/db-test/route.ts
import { NextResponse } from 'next/server';
import { query } from '../../../backend/db';

export async function GET() {
  try {
    const result = await query('SELECT NOW() AS now_timestamp') as { now_timestamp: string }[];
    
    return NextResponse.json({
      message: 'Database connection successful',
      timestamp: result[0].now_timestamp
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
