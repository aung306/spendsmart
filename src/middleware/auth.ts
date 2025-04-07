import { NextRequest} from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secure-jwt-secret-key';

export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
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
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) { return { authenticated: false }; }
    
    const token = authHeader.split(' ')[1];
    // Verify the token
    const payload = verifyToken(token);
    
    if (!payload) { return { authenticated: false }; }
    
    // Return authentication status and user info
    return { 
      authenticated: true, 
      user: {
        userId: payload.userId,
        email: payload.email,
        username: payload.username
      }
    };
  } 
  catch (error) { 
    console.error('Authentication error:', error);
    return { authenticated: false }; 
  }
}