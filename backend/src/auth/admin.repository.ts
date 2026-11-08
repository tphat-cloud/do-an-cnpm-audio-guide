import type { RowDataPacket } from 'mysql2';
import { pool } from '../config/database';

const MAX_FAILED_ATTEMPTS = 5;

export interface AdminAccount {
  id: number;
  username: string;
}

interface AdminRow extends RowDataPacket {
  id: number;
  username: string;
  password_hash: string;
  failed_attempts: number;
  locked_until: Date | string | null;
  lock_remaining_seconds: number | null;
}

export type AdminLoginResult =
  | { status: 'invalid' }
  | { status: 'locked'; retryAfterSeconds: number }
  | { status: 'authenticated'; admin: AdminAccount };

/** Khóa hàng admin để kiểm tra và cập nhật số lần đăng nhập sai tuần tự. */
export async function authenticateAdmin(
  username: string,
  checkPassword: (passwordHash: string) => Promise<boolean>
): Promise<AdminLoginResult> {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const [rows] = await connection.query<AdminRow[]>(
      `SELECT id, username, password_hash, failed_attempts, locked_until,
              TIMESTAMPDIFF(SECOND, CURRENT_TIMESTAMP, locked_until) AS lock_remaining_seconds
         FROM admins
        WHERE username = ?
        LIMIT 1
        FOR UPDATE`,
      [username]
    );

    const row = rows[0];
    if (!row) {
      await connection.commit();
      return { status: 'invalid' };
    }

    const remainingSeconds = Number(row.lock_remaining_seconds ?? 0);
    if (remainingSeconds > 0) {
      await connection.commit();
      return {
        status: 'locked',
        retryAfterSeconds: Math.max(1, Math.ceil(remainingSeconds)),
      };
    }

    let failedAttempts = row.failed_attempts;
    if (row.locked_until !== null) {
      await connection.execute(
        'UPDATE admins SET failed_attempts = 0, locked_until = NULL WHERE id = ?',
        [row.id]
      );
      failedAttempts = 0;
    }

    const isPasswordMatched = await checkPassword(row.password_hash);
    if (!isPasswordMatched) {
      const attempts = failedAttempts + 1;
      await connection.execute(
        `UPDATE admins
            SET failed_attempts = ?,
                locked_until = CASE
                  WHEN ? >= ? THEN DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 5 MINUTE)
                  ELSE NULL
                END
          WHERE id = ?`,
        [attempts, attempts, MAX_FAILED_ATTEMPTS, row.id]
      );
      await connection.commit();

      return attempts >= MAX_FAILED_ATTEMPTS
        ? { status: 'locked', retryAfterSeconds: 300 }
        : { status: 'invalid' };
    }

    await connection.execute(
      'UPDATE admins SET failed_attempts = 0, locked_until = NULL WHERE id = ?',
      [row.id]
    );
    await connection.commit();

    return {
      status: 'authenticated',
      admin: { id: row.id, username: row.username },
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
