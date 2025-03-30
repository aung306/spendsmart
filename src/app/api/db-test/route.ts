// src/app/api/db-test/route.ts
import { NextResponse } from 'next/server';
import { query } from '../../../backend/db';  // Note the path has three dots, not two

export async function GET() {
  try {
    const result = await query('SELECT NOW() as current_time');
    
    return NextResponse.json({
      message: 'Database connection successful',
      timestamp: result.rows[0].current_time
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