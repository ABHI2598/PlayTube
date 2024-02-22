const express = require("express");
const { asyncHandler } = require("../utils/AsyncHandler");

const registerUser = asyncHandler((req,res)=>{
    res.status(200).json({
        "message":"Hi Abhinav"
    })
});


module.exports={
    registerUser
}