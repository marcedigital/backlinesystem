declare namespace NodeJS {
    interface ProcessEnv {
      // Database configuration
      MONGODB_URI: string;
      MONGODB_DBNAME: string;
  
      // Authentication
      JWT_SECRET: string;
  
      // Environment
      NODE_ENV: 'development' | 'production' | 'test';
  
      // Optional: Other environment variables
      GOOGLE_CLIENT_ID?: string;
      GOOGLE_CLIENT_SECRET?: string;
    }
  }
  
  // Extend global Window interface for client-side storage
  interface Window {
    // Add any custom window properties if needed
  }