import { AuthObject } from '@clerk/clerk-sdk-node';

declare global {
  namespace Express {
    interface Request {
      auth: AuthObject;
    }
  }
}

// You can define more shared types here
export interface GenericResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string | any;
}
