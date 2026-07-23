import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { IUserPayload } from '../types';

export const generateToken = (payload: IUserPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any
  });
};

export const verifyToken = (token: string): IUserPayload => {
  return jwt.verify(token, env.JWT_SECRET) as IUserPayload;
};
