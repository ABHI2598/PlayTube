const express = require("express");

const userRouter = require("./user.routes");
const videoRouter = require("./video.routes");
const router = express.Router();

router.use("/user", userRouter);
router.use("/video", videoRouter);

module.exports= router