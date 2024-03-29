const zod = require("zod");
const jwt = require("jsonwebtoken");
const mongoose= require("mongoose");
const uploadOnCloudinary = require("../utils/cloudinary");
const { asyncHandler } = require("../utils/AsyncHandler");
const { ApiError } = require("../utils/ApiError");
const { User } = require("../models/user.model");
const { ApiResponse } = require("../utils/ApiResponse");

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
    email: zod.string().email(),
    password: zod.string()
})

const loginUser = asyncHandler( async(req,res) => {
    const { success } = loginSchema.safeParse(req.body);
    

    if(!success)
    {
        throw new ApiError(409, "All fields are Mandatory ");
    }

    const { username, email, password } = req.body;

    const user = await User.findOne({
        $or: [ { username }, { email }]
    });

    if(!user)
    {
        throw new ApiError(404, "User not found");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);

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

const refreshAccessToken = asyncHandler( async(req,res) => {
    const incomingRefreshToken = req?.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken)
    {
        throw new ApiError(401, "Unauthorized Request");
    }

    try {

        const decoded = await jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        
        const user = await User.findById(decoded._id);

        if(!user)
        {
            throw new ApiError(401, "Invalid token");
        }

        if(incomingRefreshToken !== user?.refreshToken)
        {
            throw new ApiError(401, "Inavlid refresh token");
        }

        const options = {
            httpOnly: true,
            secure: true
        };

        const {accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

        return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200,{accessToken, refreshToken}, "Access token refresh Success")
        );
        
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token");
    }
});

const changeCurrentPassword = asyncHandler( async(req,res) => {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);

    if(!user)
    {
        throw new ApiError(401, "User does not exists");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect)
    {
        throw new ApiError(401, "Old password did not match");
    }

    user.password = newPassword;

    await user.save({ validateBeforeSave: false });

    return res.status(200).json( new ApiResponse(200, {}, "Password Changed SuccessFully"));
});

const updateAccountDetails = asyncHandler( async(req,res) =>{
    const { fullName, email } = req.body;
    
    if( !fullName || !email )
    {
        throw new ApiError(401, "All fields are Mandatory");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                fullName,
                email
            }
        },
        {
            new: true
        }
    ).select(" -password");

    return res.status(200).json(new ApiResponse(200,user, "Account details updated!!"));

});

const updateAvatarImage = asyncHandler( async(req,res)=>{
    const avatarLocalPath = req.file?.path;

    if(!avatarLocalPath)
    {
        throw new ApiError(401,"avatarLocalPath does not exists");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if(!avatar?.url)
    {
        throw new ApiError(401,"Avatar url not found");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                avatar: avatar?.url
            }
        },
        {
            new : true,
        }
    ).select(" -password");

    return res.status(200).json(new ApiResponse(200,user,"Avatar updated SuccessFully"));

});

const updateCoverImage = asyncHandler( async(req,res)=>{
    const coverImageLocalPath = req.file?.path;

    if(!coverImageLocalPath)
    {
        throw new ApiError(401,"coverImageLocal Path does not exists");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    //console.log("image: "+ coverImage)
    if(!coverImage?.url)
    {
        throw new ApiError(401, "coverImage url not found");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                coverImage: coverImage?.url
            }
        },
        {
            new:true
        }
    );

    return res.status(200).json(new ApiResponse(200,user,"coverImage update success"));
});

const getCurrentUser = asyncHandler( async(req,res)=>{
    return res.status(200).json(
        new ApiResponse(200, req.user, "User fetched SuccessFully")
    );
});


const getUserChannelProfile = asyncHandler( async(req,res)=>{
    const { username } = req.params;
    
    if(!username)
    {
        throw new ApiError(401, "Username invalid");
    }

    const channel = await User.aggregate([ 
        {
            $match: {
                username: username
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "Subscribers"
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "SubscriberedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size: "$Subscribers"
                },
                subsribedToCount:{
                    $size: "$SubscriberedTo"
                },
                isSubscribed:{
                    $cond:{
                        if: { $in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project:{
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ]);

    if(!channel.length)
    {
        throw new ApiError(401, "channel does not exists");
    }

    return res.status(200).json( new ApiResponse(200, channel[0], "User channel fetched successfully"));
});


const getUserWatchHistory = asyncHandler( async(req,res)=>{
       
     const user = await User.aggregate([
        {
            $match:{
               _id: new mongoose.Schema.Types.ObjectId(req.user_id)
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "_id",
                foreignField: "watchHistory",
                as: "watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName: 1,
                                        username:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                       $addFields:{
                           owner: {
                               $arrayElemAt: ["$owner", 0]
                           }
                       }  
                    }
                ]
            }
        }
     ]);

     return res.status(200).json( new ApiResponse(200, user[0], "Current WatchHistory Fetched SuccessFully"));
});

module.exports={
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    updateAccountDetails,
    updateAvatarImage,
    updateCoverImage,
    getCurrentUser,
    getUserChannelProfile,
    getUserWatchHistory
}