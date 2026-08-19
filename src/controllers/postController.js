const pool = require('../config/db');

const fetchAndSaveLivePosts = async (req, res) => {
  try {
    // 1. Buat tabel jika belum ada (sesuai db_table = 'transactions_manual_trigger')
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions_manual_trigger (
        id INT PRIMARY KEY,
        user_id INT,
        title VARCHAR(255),
        body TEXT,
        waktu_penarikan TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Hitung jumlah data saat ini untuk menentukan offset
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM transactions_manual_trigger'
    );
    const currentOffset = parseInt(countResult.rows[0].count, 10);
    const limit = 10;

    // 3. Fetch data dari API eksternal
    const response = await fetch(
      `https://jsonplaceholder.typicode.com/posts?_start=${currentOffset}&_limit=${limit}`
    );

    if (!response.ok) {
      return res.status(400).json({
        status: 'error',
        message: 'Gagal menghubungi JSONPlaceholder',
      });
    }

    const data = await response.json();
    let savedCount = 0;

    // 4. Upsert (update_or_create) data ke PostgreSQL
    const upsertQuery = `
      INSERT INTO transactions_manual_trigger (id, user_id, title, body, waktu_penarikan)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (id) 
      DO UPDATE SET 
        user_id = EXCLUDED.user_id,
        title = EXCLUDED.title,
        body = EXCLUDED.body,
        waktu_penarikan = NOW()
      RETURNING (xmax = 0) AS is_created;
    `;

    for (const item of data) {
      const result = await pool.query(upsertQuery, [
        item.id,
        item.userId,
        item.title,
        item.body,
      ]);
      
      // Jika xmax = 0 berarti row baru dimasukkan (CREATED)
      if (result.rows[0].is_created) {
        savedCount++;
      }
    }

    return res.json({
      status: 'success',
      message: `Berhasil menarik dan menyimpan ${savedCount} data baru ke database.`,
    });
  } catch (error) {
    console.error('Error pada fetchAndSaveLivePosts:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server',
    });
  }
};

module.exports = { fetchAndSaveLivePosts };