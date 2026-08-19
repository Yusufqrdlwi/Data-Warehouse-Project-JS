require('dotenv').config();
const express = require('express');
const cron = require('node-cron');
const pool = require('./config/db');
const fetchAndStorePosts = require('./jobs/fetchPostsJob');
const postRoutes = require('./routes/postRoutes');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Register API Routes
app.use('/api', postRoutes);

// Scheduler Cron Job (Menjalankan ETL setiap 10 menit)
cron.schedule('*/10 * * * *', () => {
  console.log('[Cron] Jalankan job fetchAndStorePosts...');
  fetchAndStorePosts();
});

// Endpoint manual trigger ETL (opsional, untuk testing)
app.post('/api/trigger-etl', async (req, res) => {
  await fetchAndStorePosts();
  res.json({ message: 'ETL Job berhasil dipanggil secara manual.' });
});

// Health check endpoint
app.get('/', async (req, res) => {
  try {
    const dbRes = await pool.query('SELECT NOW()');
    res.json({
      message: 'Server DWH Node.js Berjalan!',
      db_time: dbRes.rows[0].now,
    });
  } catch (err) {
    res.status(500).json({ error: 'Gagal terhubung ke Database' });
  }
});

app.listen(port, () => {
  console.log(`Server DWH berjalan di http://localhost:${port}`);
});