import { NextRequest, NextResponse } from 'next/server';
import { logToConsole } from './logger';

export type ApiHandlerFunction = (req: NextRequest, params?: any) => Promise<NextResponse>;

/**
 * Wraps an API handler with timeout and error handling
 * @param handler The API handler function
 * @param timeoutMs Timeout in milliseconds (default: 50000)
 */
export function withErrorHandling(handler: ApiHandlerFunction, timeoutMs = 50000) {
  return async (req: NextRequest, params?: any): Promise<NextResponse> => {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();
    
    // Log the incoming request
    logToConsole('info', `API Request started: ${req.method} ${req.nextUrl.pathname}`, {
      requestId,
      method: req.method,
      url: req.nextUrl.toString(),
    });

    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`API request timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      });

      // Race the handler against the timeout
      const response = await Promise.race([
        handler(req, params),
        timeoutPromise
      ]);

      // Log successful completion
      const duration = Date.now() - startTime;
      logToConsole('info', `API Request completed: ${req.method} ${req.nextUrl.pathname}`, {
        requestId,
        duration: `${duration}ms`,
        status: response.status
      });

      return response;
    } catch (error) {
      // Handle errors
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const stack = error instanceof Error ? error.stack : undefined;

      logToConsole('error', `API Request failed: ${req.method} ${req.nextUrl.pathname}`, {
        requestId,
        duration: `${duration}ms`,
        error: errorMessage,
        stack
      });

      // If it's a timeout error, return a Gateway Timeout response
      if (errorMessage.includes('timed out')) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Request timed out. Please try again later.',
            error: 'GATEWAY_TIMEOUT' 
          },
          { status: 504 }
        );
      }

      return NextResponse.json(
        { 
          success: false, 
          message: 'An error occurred while processing your request',
          error: errorMessage
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware to retry database operations on failure
 * @param operation The database operation to perform
 * @param maxRetries Maximum number of retries
 * @param retryIntervalMs Milliseconds to wait between retries
 */
export async function withDbRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  retryIntervalMs = 1000
): Promise<T> {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Check if this is a retryable error
      const isRetryable = isRetryableError(error);
      
      if (!isRetryable || attempt >= maxRetries) {
        break;
      }
      
      // Log retry attempt
      logToConsole('warn', `Database operation failed, retrying (${attempt}/${maxRetries})...`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, retryIntervalMs));
    }
  }
  
  // If we got here, all retries failed
  throw lastError;
}

/**
 * Determine if an error should be retried
 */
function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  
  // Common MongoDB retryable errors
  const retryableErrorMessages = [
    'connection timed out',
    'server selection timed out',
    'topology was destroyed',
    'failed to connect',
    'socket timeout',
    'network timeout',
    'Connection closed'
  ];
  
  return retryableErrorMessages.some(msg => 
    error.message.toLowerCase().includes(msg.toLowerCase())
  );
}