const jwt = require("jsonwebtoken");
const { ApiError } = require("../utils/ApiError");
const { User } = require("../models/user.model");


const AuthMiddleWare = async (req, _, next) => {
    try 
    {
       const token = req?.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");
       
       if(!token)
       {
         throw new ApiError(401, "Unauthorized Access");
       }

       const decodedUser = await jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);

       const user = await User.findById(decodedUser._id).select(" -password -refreshToken");

       if(!user)
       {
          throw new ApiError(401, "Invalid Access Token");
       }

       req.user = user;
       next();

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token");
    }
};

module.exports = AuthMiddleWare;