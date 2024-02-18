const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


const UserSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        lowercase:true,
        index:true,
        trim:true,
        unique:true,
    },
    email:{
        type:String,
        required:true,
        trim:true,
        unique:true
    },
    fullName:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    avatar:{
        type:String, 
        required:true
    },
    coverImage:{
        type:String
    },
    watchHistory:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password:{
        type:String,
        required:[true, "Password Required"]
    },
    refreshToken:{
        type:String
    }
},{ timestamps: true });


//Pre is hook provided by mongoose to perform computations before anything store to database
UserSchema.pre("save", async function(next){
      if(!this.isModified("password")) return next();
      this.password = await bcrypt.hash(this.password,10);
      next();
});

UserSchema.methods.isPasswordCorrect = async function(password){
       return await bcrypt.compare(password,this.password);
}

UserSchema.methods.generateAccessToken = function()
{
    return jwt.sign({
        _id: this._id,
        username: this.username,
        fullName: this.fullName,
        email:this.email
    }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY });
}

UserSchema.methods.generateRefreshToken = function()
{
    return jwt.sign({
        _id: this._id
    }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRY });
}
const User = mongoose.model("User", UserSchema);

module.exports={
    User
}