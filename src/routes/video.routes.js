const express = require("express");

const AuthMiddleWare = require("../middlewares/auth.middlerware");
const {publishVideo} = require("../controllers/video.controller");
const upload =require("../middlewares/multer.middleware");

const router = express.Router();



router.post("/publish", upload.fields([ 
    {
        name: "videoFile",
        maxCount: 1
    },
    {
        name: "thumbnail",
        maxCount: 1
    }
]),
 AuthMiddleWare, publishVideo);


module.exports = router;