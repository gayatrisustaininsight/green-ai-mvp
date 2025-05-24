const express = require("express");
const router=express.Router();
const {LeedScoreController}=require("../controller/LeedScoreController.js")


router.get("/leedScore",  LeedScoreController);
