const express = require('express');
const router = express.Router();
const { fetchAndSaveLivePosts } = require('../controllers/postController');

router.get('/fetch-live-posts', fetchAndSaveLivePosts);

module.exports = router;