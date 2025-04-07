import { NextRequest, NextResponse } from "next/server";
import { CustomerUser } from "@/models";
import { connectToDatabase } from "@/utils/database";
import { verifyAdminAuth } from "@/utils/adminAuth";
import { logToConsole } from "@/utils/logger";
import { MongoClient } from 'mongodb';

// Define interfaces
interface NextAuthUser {
  _id: any;
  id?: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  createdAt?: Date;
}

interface FormattedUser {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber: string;
  totalBookings: number;
  totalSpent: number;
  googleId: string;
  createdAt: Date;
  isGoogleUser: boolean;
}

// Get MongoDB URI from environment variables
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not defined');
}

export async function GET(req: NextRequest) {
  try {
    // Verify admin authentication
    try {
      const isAdmin = await verifyAdminAuth(req);
      if (!isAdmin) {
        return NextResponse.json(
          { message: "Unauthorized access" },
          { status: 401 }
        );
      }
    } catch (authError) {
      logToConsole("error", "Admin auth verification error:", authError);
      return NextResponse.json(
        { message: "Authentication error" },
        { status: 401 }
      );
    }

    // Connect to database using Mongoose
    try {
      await connectToDatabase();
    } catch (dbError) {
      logToConsole("error", "Database connection error:", dbError);
      return NextResponse.json(
        { message: "Database connection failed" },
        { status: 500 }
      );
    }

    // Pagination parameters
    const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Get users from CustomerUser collection
    let customerUsers = [];
    try {
      customerUsers = await CustomerUser.find({})
        .select("-password")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
    } catch (error) {
      logToConsole("error", "Error fetching CustomerUser data:", error);
      // Continue with empty array - we'll still try to get NextAuth users
      customerUsers = [];
    }

    // Direct MongoDB connection for NextAuth users
    let nextAuthUsers = [];
    let formattedNextAuthUsers: FormattedUser[] = [];
    
    try {
      // Create a new MongoDB client directly
      const client = new MongoClient(MONGODB_URI);
      await client.connect();
      
      const db = client.db(process.env.MONGODB_DBNAME || 'backline');
      
      // Get users from NextAuth users collection
      nextAuthUsers = (await db
        .collection("users")
        .find({})
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .toArray()) as NextAuthUser[];

      // Transform NextAuth users
      formattedNextAuthUsers = nextAuthUsers.map((user): FormattedUser => ({
        _id: user._id.toString(),
        firstName: user.name?.split(" ")[0] || "Google",
        lastName: user.name?.split(" ").slice(1).join(" ") || "User",
        email: user.email,
        phoneNumber: user.phoneNumber || "",
        totalBookings: 0,
        totalSpent: 0,
        googleId: user.id || "google-user",
        createdAt: user.createdAt || new Date(),
        isGoogleUser: true,
      }));
      
      // Count NextAuth users
      const totalNextAuthUsers = await db.collection("users").countDocuments({});
      
      // Close the client connection
      await client.close();
    } catch (nextAuthError) {
      logToConsole("error", "Error fetching NextAuth users:", nextAuthError);
      // Continue with empty arrays if this fails
      nextAuthUsers = [];
      formattedNextAuthUsers = [];
    }

    // Continue with the rest of your code - combining users, etc.
    const emailSet = new Set();
    const allUsers = [];

    // Add CustomerUsers first
    for (const user of customerUsers) {
      allUsers.push(user);
      emailSet.add(user.email);
    }

    // Add NextAuth users that aren't already included
    for (const user of formattedNextAuthUsers) {
      if (!emailSet.has(user.email)) {
        allUsers.push(user);
        emailSet.add(user.email);
      }
    }

    // Get total count of CustomerUsers
    let totalCustomerUsers = 0;
    try {
      totalCustomerUsers = await CustomerUser.countDocuments({});
    } catch (error) {
      logToConsole("error", "Error counting CustomerUser documents:", error);
    }

    // Estimate total unique users
    const totalNextAuthUsers = nextAuthUsers.length; // Fallback if count failed
    const estimatedTotalUnique = totalCustomerUsers + totalNextAuthUsers;

    return NextResponse.json({
      users: allUsers,
      pagination: {
        total: estimatedTotalUnique,
        page,
        limit,
        pages: Math.ceil(estimatedTotalUnique / limit),
      },
    });
  } catch (error) {
    logToConsole("error", "Error fetching users:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Error fetching users",
        error: error instanceof Error ? error.stack : "Unknown error",
      },
      { status: 500 }
    );
  }
}