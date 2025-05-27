const { uploadFile } = require('../utils/azureBlob');
const path = require('path');
const { v4: uuid } = require('uuid');
const { successResponse, errorResponse } = require('../utils/response');

exports.FileUpload = async (req, res) => {
    const foldername = req.params.foldername;

    try {
        if (!req.files) {
            return errorResponse(res, {
                statusCode: 400,
                message: "File is required"
            });
        }

        let fileNameExist = req.body || {};

        const fileDetails = await Promise.all(
            req.files.map(async (item) => await uploadFile(foldername, `${fileNameExist[item.fieldname] || uuid()}${path.extname(item.originalname)}`, item.buffer, item.mimetype))
        );

        if (fileDetails) {
            let fileSave = [];

            req.files.forEach((element, index) => {
                fileSave.push({
                    name: element.originalname.replace(/ /g, '_'),
                    url: fileDetails[index].url,
                    lastModified: fileDetails[index].lastModified,
                    size: element.size,
                    type: element.mimetype
                });

            });

            return successResponse(res, {
                statusCode: 200,
                message: "Successfully Upload",
                data: fileSave
            });
        } else {
            return errorResponse(res, {
                statusCode: 404,
                message: "Unable to Upload"
            });
        }
    } catch (error) {
        console.log(error);
        return errorResponse(res, {
            statusCode: 400,
            message: error.message
        });
    }
};


