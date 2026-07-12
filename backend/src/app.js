const express = require('express');

const app = express();

app.use("/",(req ,res)=>{
    res.send("Hello from BE")
})

app.listen(3000, ()=>{
    console.log("server started at 3000")
})