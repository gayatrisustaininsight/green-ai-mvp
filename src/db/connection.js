require('dotenv').config();
const mongoose = require("mongoose");
const mongouri = process.env.MONGO_URI;

async function dbConnectionFunction() {
    return new Promise(async (resolve, reject) => {
        try {
            await mongoose
                .connect(mongouri)
                .then(() => {
                    console.log("*****************Database connected***************\n");
                    resolve(true);
                })
                .catch((err) => {
                    console.log("Failed to connect Database", err);
                    reject(err);
                });
        } catch (error) {
            reject(error);
        }
    });
};
module.exports = {
    dbConnectionFunction,
};
