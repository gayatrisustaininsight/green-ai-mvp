const { uploadFile } = require('../utils/azureBlob');

exports.FileUpload = async (req, res) => {
    const { file } = req.body;
    const { buffer, originalname, mimetype } = file;
    const result = await uploadFile(buffer, originalname, mimetype);
    res.json(result);
}


