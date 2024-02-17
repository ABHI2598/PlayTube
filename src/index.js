require("dotenv").config({path: "./.env"});
const { connectToDB } = require("./db");

connectToDB();