declare namespace calendar_v3 {
    interface Schema$Event {
      id?: string;
      summary?: string;
      description?: string;
      start?: {
        dateTime?: string;
        date?: string;
        timeZone?: string;
      };
      end?: {
        dateTime?: string;
        date?: string;
        timeZone?: string;
      };
      [key: string]: any;
    }
    
    interface SchemaEvent extends Schema$Event {}
  }