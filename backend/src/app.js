const express = require('express');
const path = require('path');
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const connectDB = require("./config/database")
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();

app.use(cors({
    origin:"http://localhost:5173",
    credentials:true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());
app.use(cookieParser());

const authRouter = require('./routes/auth');

app.use("/",authRouter)

connectDB()
    .then(()=>{
        console.log("Database Connected Succesfully");
        app.listen(3000,()=>{
            console.log("Server Started at Port 3000");
        })
    })
    .catch((err)=>{
        console.log("Error : DataBase can't Connect " + err.message);
    })