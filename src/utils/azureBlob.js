const { BlobServiceClient, StorageSharedKeyCredential } = require("@azure/storage-blob");

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_ACCESS_KEY;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
const blobServiceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    sharedKeyCredential
);

const containerClient = blobServiceClient.getContainerClient(containerName);

async function uploadFile(buffer, filename, mimetype) {
    const blockBlobClient = containerClient.getBlockBlobClient(filename);
    const uploadBlobResponse = await blockBlobClient.uploadData(buffer, {
        blobHTTPHeaders: { blobContentType: mimetype }
    });
    return {
        url: blockBlobClient.url,
        requestId: uploadBlobResponse.requestId,
    };
}

module.exports = {
    uploadFile,
};
