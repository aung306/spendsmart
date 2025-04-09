import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secure-jwt-secret-key';

export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  account_id: number;
  iat: number;
  exp: number;
}

export function verifyToken(token: string): JWTPayload | null {
  try { return jwt.verify(token, JWT_SECRET) as JWTPayload; } 
  catch (error) { 
    console.error('Token verification error:', error);
    return null; 
  }
}

// verify authentication token and return user information
export async function verifyAuth(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload = verifyToken(token);
      
      if (payload) {
        return { 
          authenticated: true, 
          user: {
            userId: payload.userId,
            email: payload.email,
            username: payload.username,
            account_id: payload.account_id
          }
        };
      }
    }
    
    // If no valid auth header, check for accessToken cookie (for browser sessions)
    const accessToken = req.cookies.get('accessToken')?.value;
    
    if (accessToken) {
      const payload = verifyToken(accessToken);
      
      if (payload) {
        return { 
          authenticated: true, 
          user: {
            userId: payload.userId,
            email: payload.email,
            username: payload.username,
            account_id: payload.account_id
          }
        };
      }
    }
    return { authenticated: false };
  } 
  catch (error) { 
    console.error('Authentication error:', error);
    return { authenticated: false }; 
  }
}

// Function to add account_id to API requests
export async function injectAccountId(req: NextRequest) {
  const result = await verifyAuth(req);
  
  if (!result.authenticated) { return null; }
  
  const { pathname } = req.nextUrl;
  
  // make sure account_id is included
  if (pathname.startsWith('/api/')) {
    // For GET requests, add account_id to query parameters if not present
    if (req.method === 'GET') {
      const url = new URL(req.url);
      
      // Only add account_id if not already present
      if (!url.searchParams.has('account_id') && result.user?.account_id) {
        url.searchParams.set('account_id', result.user.account_id.toString());
        return NextResponse.rewrite(url);
      }
    }
    
    // For POST/PUT requests, we'll add a header with the account_id
    // API routes will need to extract this
    if ((req.method === 'POST' || req.method === 'PUT') && result.user?.account_id) {
      const response = NextResponse.next();
      response.headers.set('X-User-ID', result.user.account_id.toString());
      return response;
    }
  }
  
  return NextResponse.next();
}
