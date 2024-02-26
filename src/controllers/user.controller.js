const express = require("express");
const { asyncHandler } = require("../utils/AsyncHandler");
const { ApiError } = require("../utils/ApiError");
const { User } = require("../models/user.model");
const uploadOnCloudinary = require("../utils/cloudinary");
const { ApiResponse } = require("../utils/ApiResponse");


const registerUser = asyncHandler( async(req,res)=>{
    const {username, email, fullName, password} = req.body;

    if( [username, email, fullName, password].some( (fields) => fields?.trim() === ""))
    {
        throw new ApiError(400, "All fields are Mandatory");
    }

    const existedUser = await User.findOne({
        $or: [ { username }, { email } ]
    });

    if(existedUser)
    {
        throw new ApiError(409,"User Already Exists");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    //console.log('Avatar localFilePath....' + avatarLocalPath);
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0)
    {
        coverImageLocalPath = req.files.coverImage[0].path;
    }
     
    if(!avatarLocalPath)
    {
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar =  await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    //console.log('Avatar....' + avatar);
    const user = await User.create({
        username,
        fullName,
        email,
        password,
        avatar: avatar?.url,
        coverImage: coverImage?.url || ""

    });

    const createdUser = await User.findById(user._id).select( " -password -refreshToken ");

    if(!createdUser)
    {
        throw new ApiError(500, "Something went wrong while registering");
    }

    return res.status(201).json(
         new ApiResponse(200, createdUser, "User Created SuccessFully")
    );

});


module.exports={
    registerUser
}