// POST /api/budget/update
import { NextResponse } from 'next/server';
import { query } from '../../../../backend/db';
export async function POST(req: Request) {
    try {
      const { budget_id, allocation, amount } = await req.json();
  
      if (!budget_id || allocation === undefined || amount === undefined) {
        return NextResponse.json(
          { message: 'budget_id, and allocation are required.' },
          { status: 400 }
        );
      }
  
      await query(
        `UPDATE budget SET allocation = ?, amount = ?
         WHERE budget_id = ?`,
        [allocation, amount, budget_id]
      );
  
      return NextResponse.json({
        message: `Budget ${budget_id} updated successfully.`,
      });
    } catch (error) {
      console.error('Error updating budget:', error);
      return NextResponse.json(
        {
          message: 'Failed to update budget.',
          error: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
  }
  