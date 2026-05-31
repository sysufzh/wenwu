import { getDb } from './index';
import bcrypt from 'bcryptjs';

export interface User {
  id: number;
  username: string;
  password_hash: string;
  role: 'admin' | 'user';
  display_name: string;
  created_at: string;
}

export type SafeUser = Omit<User, 'password_hash'>;

export function getUserByUsername(username: string): User | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined;
}

export function getUserById(id: number): User | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
}

export function verifyPassword(user: User, password: string): boolean {
  return bcrypt.compareSync(password, user.password_hash);
}

export function toSafeUser(user: User): SafeUser {
  const { password_hash, ...safe } = user;
  return safe;
}
