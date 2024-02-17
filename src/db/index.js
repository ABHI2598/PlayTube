const mongoose = require("mongoose");
const { DB_NAME } = require("../constants");

const connectToDB = async () =>
{
   try
   { 
       const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
       console.log("Connected to MONGO DB SUCCESS : " + connectionInstance);
   }
   catch(err)
   {
      console.log("MONGODB CONNECTION FAILED : "+ err);
      process.exit(1);
   }
};

module.exports ={
    connectToDB
}