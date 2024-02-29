
const express = require("express");
const upload  = require("../middlewares/multer.middleware");
const AuthMiddleWare = require("../middlewares/auth.middlerware");
const {registerUser, loginUser, logoutUser, refreshAccessToken, getCurrentUser, changeCurrentPassword, updateAvatarImage, updateCoverImage, updateAccountDetails, getUserChannelProfile, getUserWatchHistory} = require("../controllers/user.controller");

const router = express.Router();

router.post("/register" , upload.fields([
    {
        name: "avatar",
        maxCount: 1
    }, 
    {
        name: "coverImage",
        maxCount: 1
    }
]), registerUser);

router.post("/login", loginUser);

router.post("/logout",AuthMiddleWare, logoutUser);

router.post("/refresh-access-token", refreshAccessToken);

router.get("/getCurrentUser",AuthMiddleWare, getCurrentUser);

router.put("/changePassword", AuthMiddleWare, changeCurrentPassword);

router.put("/updateAvatar",upload.single("avatar"),AuthMiddleWare, updateAvatarImage);

router.put("/updateCoverImage",upload.single("coverImage"), AuthMiddleWare, updateCoverImage);

router.put("/updateAccountDetails", AuthMiddleWare, updateAccountDetails);

router.get("/fetchChannel/:username", AuthMiddleWare, getUserChannelProfile);

router.get("/channel", AuthMiddleWare, getUserWatchHistory);

module.exports=router