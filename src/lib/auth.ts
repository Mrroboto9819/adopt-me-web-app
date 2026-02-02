import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '$env/static/private';

export interface AuthPayload {
    userId: string;
}

export const signToken = (userId: string): string => {
    if (!JWT_SECRET) throw new Error('JWT_SECRET is not defined');
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): AuthPayload | null => {
    if (!JWT_SECRET) throw new Error('JWT_SECRET is not defined');
    try {
        return jwt.verify(token, JWT_SECRET) as AuthPayload;
    } catch (error) {
        return null;
    }
};
