const express = require('express');
const router = express.Router();
const { FileUpload } = require('../controllers/fileUploadController');

router.post('/', FileUpload);

module.exports = router;
