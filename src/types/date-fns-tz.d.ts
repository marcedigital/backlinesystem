declare module 'date-fns-tz' {
    import { format as formatDate } from 'date-fns';
    
    export function utcToZonedTime(date: Date | number, timeZone: string): Date;
    export function zonedTimeToUtc(date: Date | number, timeZone: string): Date;
    export function format(date: Date | number, format: string, options?: { timeZone?: string }): string;
  }