import jwt, { SignOptions } from 'jsonwebtoken';

// Ensure JWT_SECRET is defined
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

// Token interfaces
export interface TokenPayload {
  id: string;
  email: string;
  role: 'customer' | 'admin';
}

// More precise type definitions for JWT methods
interface JWTSignOptions {
  expiresIn?: string | number;
}

class AuthService {
    static generateToken(
        payload: Record<string, any>, 
        options: SignOptions = {}
      ): string {
        const defaultOptions: SignOptions = {
          expiresIn: '7d'
        };

    const mergedOptions = { ...defaultOptions, ...options };

    return jwt.sign(
        payload, 
        process.env.JWT_SECRET!, 
        { ...defaultOptions, ...options }
    );
  }

  // Verify JWT token with improved error handling and typing
  static verifyToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(
        token, 
        JWT_SECRET,
        { complete: false }
      ) as TokenPayload;

      return {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      throw new Error('Token verification failed');
    }
  }

  // Optional: Decode token without verification
  static decodeToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.decode(token) as TokenPayload;
      return decoded ? {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      } : null;
    } catch {
      return null;
    }
  }
}

export default AuthService;