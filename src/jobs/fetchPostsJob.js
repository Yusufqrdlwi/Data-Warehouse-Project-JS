const pool = require('../config/db');

async function fetchAndStorePosts() {
  try {
    // 1. Buat tabel penampung offset jika belum ada
    await pool.query(`
      CREATE TABLE IF NOT EXISTS etl_variables (
        key VARCHAR(50) PRIMARY KEY,
        value INT NOT NULL
      );
    `);

    // Ambil current_offset dari DB
    const offsetResult = await pool.query(
      "SELECT value FROM etl_variables WHERE key = 'post_offset'"
    );
    let currentOffset = offsetResult.rows.length > 0 ? offsetResult.rows[0].value : 0;
    const limit = 10;

    // 2. Fetch data dari API
    const url = `https://jsonplaceholder.typicode.com/posts?_start=${currentOffset}&_limit=${limit}`;
    const response = await fetch(url);
    const posts = await response.json();

    if (!posts || posts.length === 0) {
      console.log('Data habis.');
      return;
    }

    // Mendapatkan waktu saat ini dalam timezone Asia/Jakarta
    const waktuSekarangWib = new Date().toLocaleString('sv-SE', {
      timeZone: 'Asia/Jakarta',
    });

    // 3. Buat tabel transactions jika belum ada
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT PRIMARY KEY,
        user_id INT,
        title VARCHAR(255),
        body TEXT,
        waktu_penarikan TIMESTAMP
      );
    `);

    // 4. Query Insert Batch dengan Anti-Duplikasi (ON CONFLICT DO NOTHING)
    const insertQuery = `
      INSERT INTO transactions (id, user_id, title, body, waktu_penarikan)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO NOTHING;
    `;

    for (const post of posts) {
      await pool.query(insertQuery, [
        post.id,
        post.userId,
        post.title,
        post.body,
        waktuSekarangWib,
      ]);
    }

    // 5. Update offset untuk penarikan berikutnya
    const newOffset = currentOffset + limit;
    await pool.query(`
      INSERT INTO etl_variables (key, value)
      VALUES ('post_offset', ${newOffset})
      ON CONFLICT (key) DO UPDATE SET value = ${newOffset};
    `);

    console.log(`[ETL Sukses] Berhasil memproses ${posts.length} data. Offset baru: ${newOffset}`);
  } catch (error) {
    console.error('Error saat menjalankan ETL fetchPosts:', error);
  }
}

module.exports = fetchAndStorePosts;