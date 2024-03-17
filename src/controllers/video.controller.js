const { User } = require("../models/user.model");
const { Video } = require("../models/video.model");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { asyncHandler } = require("../utils/AsyncHandler");
const uploadOnCloudinary = require("../utils/cloudinary");



const publishVideo = asyncHandler( async(req,res)=>{
        const {title, description } = req.body;
        
        if( [title, description ].some((fields) => fields?.trim() === ""))
        {
            throw new ApiError(400, "Title or description missing")
        }

        const videoLocalPath = req.files?.videoFile[0].path;
        if( !videoLocalPath )
        {
            throw new ApiError(401, "Error video file missing");
        }

        const thumbnailLocalPath = req.files?.thumbnail[0].path;
        if(!thumbnailLocalPath)
        {
            throw new ApiError(401, "thumbnail is required");
        }

        let videoFile ="";
        if(req?.files.videoFile[0].size <= 100 * 1024 * 1024)
        {
            videoFile = await uploadOnCloudinary(videoLocalPath);
        }
        else
        {
            throw new ApiError(409, "Video can be 100 mb or less");
        } 
       
        if(!videoFile)
        {
            throw new ApiError(404, "Error while uploading videoFile");
        }

        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

        if(!thumbnail)
        {
            throw new ApiError(404, "Error while uploading thumbnail");
        }

        const user = await User.findById(req.user._id).select(" -password -refreshToken");

        if(!user)
        {
            throw new ApiError(400, "User not found");
        }

        const video = await Video.create({
            title,
            description,
            videoFile: {
                url : videoFile?.url,
                publicId: videoFile?.public_id
            },
            thumbnail:{
                url: thumbnail?.url,
                publicId: thumbnail?.public_id
            },
            views: 0,
            duration: videoFile?.duration,
            owner: user._id
        });

        const createdVideo = await Video.findById(video._id);

        if(!createdVideo)
        {
            throw new ApiError(400, "Error while publishing the video");
        }

        return res.status(200).json(
            new ApiResponse(200,createdVideo,"Video Published SuccessFully")
        );

});

// const getVideoById = asyncHandler( async(req,res) => {
//      const { videoId } = req.params;
     
//      const video = await Video.findById(videoId);

//      if(!video)
//      {
//         throw new ApiError(400, "Invalid Video Id");
//      }



// })

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(401, "Video not found")
    }

    video.isPublished = !video.isPublished

    const updatedVideo = await video.save({ validateBeforeSave: false });
    if (!updatedVideo) {
        throw new ApiError(400, "error while updating video");
    }

    res.status(200).json(new ApiResponse(200, updatedVideo, "Publish status toggled successfully"));
})









module.exports = {
    publishVideo,
    togglePublishStatus
}