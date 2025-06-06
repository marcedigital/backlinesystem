import "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Extend the built-in session types
   */
  interface Session {
    user: {
      id?: string;
    } & DefaultSession["user"]
  }
  
  /**
   * Extend the built-in JWT types
   */
  interface JWT {
    userId?: string;
  }
}