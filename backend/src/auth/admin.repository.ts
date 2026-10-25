import type { RowDataPacket } from 'mysql2';
import { pool } from '../config/database';

export interface AdminAccount {
  id: number;
  username: string;
  passwordHash: string;
}

interface AdminRow extends RowDataPacket {
  id: number;
  username: string;
  password_hash: string;
}

/** Tìm admin theo username; trả null nếu không có (dùng cho API01 - UC07). */
export async function findAdminByUsername(
  username: string
): Promise<AdminAccount | null> {
  const [rows] = await pool.query<AdminRow[]>(
    'SELECT id, username, password_hash FROM admins WHERE username = ? LIMIT 1',
    [username]
  );

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,
  };
}
