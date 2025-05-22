const express = require('express');
const router = express.Router();
const multer = require('multer');
const { FileUpload } = require('../controllers/fileUploadController');

const upload = multer({});

router.post('/:foldername', upload.any(), FileUpload);

module.exports = router;
