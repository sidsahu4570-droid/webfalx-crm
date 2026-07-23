import { Request } from 'express';

export type UserRole = 'caller' | 'admin';

export interface IUserPayload {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: IUserPayload;
    }
  }
}
