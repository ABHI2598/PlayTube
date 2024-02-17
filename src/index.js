require("dotenv").config({path: "./.env"});
const connectToDB  = require("./db");
const app = require("./app");

connectToDB()
.then(()=>{
    app.listen(process.env.PORT || 8000 , () => {
        console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    });
})
.catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
})