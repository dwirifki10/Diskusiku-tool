const express = require('express');
const multer = require('multer');
const { tesseractController, deleteFilesController } = require('../controllers/TranscriptController');

const upload = multer({ dest: './src/storage/images' });
const router = express.Router();

router.get('/', (req, res) => {
	res.send('Halaman Utama');
});

router.get('/delete-files', deleteFilesController);
router.post('/extract-text', upload.single('image'), tesseractController);

module.exports = router;
