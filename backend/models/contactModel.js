import pool from "../models/db.js";

/** Thêm liên hệ mới */
export async function addContact({ name, email, message }) {
  const result = await pool.query(
    `INSERT INTO contacts (name, email, message)
     VALUES ($1, $2, $3) RETURNING *`,
    [name, email, message]
  );
  return result.rows[0];
}

/** Lấy danh sách liên hệ (mới nhất trước) */
export async function getAllContacts() {
  const result = await pool.query(
    `SELECT * FROM contacts ORDER BY created_at DESC`
  );
  return result.rows;
}

/** Xóa liên hệ theo ID */
export async function deleteContact(id) {
  await pool.query(`DELETE FROM contacts WHERE id = $1`, [id]);
}
