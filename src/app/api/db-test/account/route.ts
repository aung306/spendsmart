// src/app/api/db-test/route.ts
import { NextResponse } from 'next/server';
import { query } from '../../../../backend/db';  // Note the path has three dots, not two

// get first name, last name, and email provided the account_id
// test using http://localhost:3000/api/db-test/account?account_id=[numer]
// make sure you add data to table before testing
export async function GET(req: Request) {
    try {
      const url = new URL(req.url);
      const accID = url.searchParams.get('account_id');
  
      if (!accID){
          return NextResponse.json(
              {message: 'account_id is required'},
              {status: 400} 
          )
      }
  
      const result = await query('SELECT first_name, last_name, email FROM account WHERE account_id = $1', [accID]);
  
      if(result.rows.length === 0){
          return NextResponse.json(
              { message: `No account found for account_id ${accID}` },
              { status: 404 }, 
          );
      }
  
      return NextResponse.json({
          account_id: accID,
          first_name: result.rows[0].first_name,
          last_name: result.rows[0].last_name,
          email: result.rows[0].email
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

  // TOOD: write post request for creating a new account
  export async function POST(req: Request) {
    try {
     
  
    } catch (error) {
      
    }
  }