const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true,
    
}));

app.use(express.json({limit:"20kb"}));
app.use(express.urlencoded({extended:true,limit:"20kb"}));
app.use(express.static("public"));
app.use(cookieParser());

//ROUTES
const mainRouter = require("./routes/index");

app.use("/api/v1", mainRouter);

module.exports={
    app
}