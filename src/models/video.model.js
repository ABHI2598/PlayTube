const mongoose = require("mongoose");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate-v2");


const VideoSchema = new mongoose.Schema({
    videoFile:{
        url:{
            type:String,
            required:true,
        },
        publicId:{
            type:String,
            required:true,
        }
    },
    thumbnail:{
        url:{
            type:String,
            required:true,
        },
        publicId:{
            type:String,
            required:true,
        }
    },
    title:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        required:true,
    },
    views:{
        type: Number,
        default:0
    },
    duration:{
        type:Number,
        required:true
    },
    isPublished:{
        type:Boolean,
        deafult: false
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }

},{ timestamps:true });

VideoSchema.plugin(mongooseAggregatePaginate);

const Video = mongoose.model("Video", VideoSchema);

module.exports={
    Video
}