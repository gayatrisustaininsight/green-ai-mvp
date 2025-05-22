require("dotenv").config();
const { BlobServiceClient } = require('@azure/storage-blob');
const { v4: uuidv4 } = require('uuid');

const accountName = process.env.AZURE_ACCOUNT_NAME;
const sasToken = "sp=racwdl&st=2025-01-18T05:28:45Z&se=2025-12-30T13:28:45Z&spr=https&sv=2022-11-02&sr=c&sig=hS%2B6DXSXc%2FZqqDcjc%2BHR8XPWarDJL6%2BxXxxozHPcxWI%3D";

// Construct the Blob Service Client using SAS token
const blobServiceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net?${sasToken}`
);

async function uploadFile(folderName = 'metadata', name = `${uuidv4()}.json`, buffer, ContentType) {
    if (!buffer) {
        throw new Error('File Body is Required');
    }

    const containerClient = blobServiceClient.getContainerClient('sustaininghts');
    const key = `${folderName}/${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}_${name}`;
    const blockBlobClient = containerClient.getBlockBlobClient(key);

    try {
        const data = await blockBlobClient.upload(buffer, buffer.length);
        console.log(data);
        const fileUrl = `https://${accountName}.blob.core.windows.net/${containerClient.containerName}/${key}`;
        console.log(`File uploaded successfully. URL: ${fileUrl}`);
        return { url: fileUrl, ...data };
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
}

module.exports = { uploadFile };
