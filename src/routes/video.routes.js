const express = require("express");

const AuthMiddleWare = require("../middlewares/auth.middlerware");
const {publishVideo,togglePublishStatus} = require("../controllers/video.controller");
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

router.post('/togglePublishStatus:videoId',AuthMiddleWare, togglePublishStatus);

module.exports = router;