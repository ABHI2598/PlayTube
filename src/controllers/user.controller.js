const express = require("express");
const { asyncHandler } = require("../utils/AsyncHandler");
const { ApiError } = require("../utils/ApiError");
const { User } = require("../models/user.model");
const uploadOnCloudinary = require("../utils/cloudinary");
const { ApiResponse } = require("../utils/ApiResponse");
const zod = require("zod");


const generateAccessAndRefreshToken = async( userId ) => {
    try {
        const user = await User.findById(userId);
    
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();
    
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false } );
    
        return {accessToken, refreshToken};

    } catch (error) {
        throw new ApiError(404, "Error while generating Access and refresh Token ");
    }


} 

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

const loginSchema = zod.object({
    username: zod.string().optional(),
    email: zod.string().optional(),
    password: zod.string()
})

const loginUser = asyncHandler( async(req,res) => {
    const { success } = loginSchema.safeParse(req.body);

    if(!success)
    {
        throw new ApiError(409, "All fields are Mandatory ");
    }

    const user = await User.findOne({
        $or: [ { username }, { email }]
    });

    if(!user)
    {
        throw new ApiError(404, "User not found");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(req.password);

    if(!isPasswordCorrect)
    {
        throw new ApiError(401, "Invalid credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select(" -password -refreshToken");

    const options ={
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User LoggedIn SuccessFully")
    );

});

const logoutUser = asyncHandler( async( req, res )=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1,
            }
        },
        {
            new: true
        }
    );

    const options = {
        httpOnly: true,
        secure: true
    };

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options).json(
        new ApiResponse(200,{}, "User logged out SuccessFully")
    );
});



module.exports={
    registerUser,
    loginUser,
    logoutUser
}