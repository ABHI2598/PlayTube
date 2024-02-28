
const express = require("express");
const upload  = require("../middlewares/multer.middleware");
const AuthMiddleWare = require("../middlewares/auth.middlerware");
const {registerUser, loginUser, logoutUser, refreshAccessToken} = require("../controllers/user.controller");

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

module.exports=router