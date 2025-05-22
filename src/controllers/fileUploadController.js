const { uploadFile } = require('../utils/azureBlob');
const path = require('path');
const { v4: uuid } = require('uuid');
const { successResponse, errorResponse } = require('../utils/response');

exports.FileUpload = async (req, res) => {
    const foldername = req.params.foldername;
    console.log(foldername, "FOLDER");

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
            let fileSave = {};
            if (req.files.length < 2) {
                req.files.forEach((element, index) => {
                    fileSave[element.fieldname] = fileDetails[index];
                });
            } else {
                req.files.forEach((element) => {
                    fileSave[element.fieldname] = [];
                });

                req.files.forEach((element, index) => {
                    fileSave[element.fieldname].push({ [element.originalname.replace(/ /g, '_')]: fileDetails[index] });
                });
            }
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


