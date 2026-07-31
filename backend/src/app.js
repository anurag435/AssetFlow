const express = require('express');
const path = require('path');
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const connectDB = require("./config/database")
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();

app.use(cors({
    origin:"https://asset-flow-kappa.vercel.app/",
    credentials:true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());
app.use(cookieParser());

const authRouter = require('./routes/auth');
const departmentRoutes = require('./routes/departmentRoutes');
const categoryRouter = require('./routes/categoryRoutes');
const assetRouter = require('./routes/assetRoutes');
const transferRouter = require('./routes/transferRoutes');
const allocationRouter = require('./routes/allocationRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const maintenanceRouter = require('./routes/maintenanceRoutes');
const auditRouter = require('./routes/auditRoutes');
const dashboardRouter = require('./routes/dashboardRoutes');
const userRouter = require('./routes/userRoutes');
const notificationRouter = require('./routes/notificationRoutes');
const reportsRouter = require('./routes/reportsRoutes');

app.use("/api/auth",authRouter)
app.use('/api/departments', departmentRoutes);
app.use('/api/categories', categoryRouter);
app.use('/api/assets', assetRouter);
app.use('/api/allocations', allocationRouter);
app.use('/api/transfers', transferRouter);
app.use('/api/bookings', bookingRouter);
app.use('/api/maintenance', maintenanceRouter);
app.use('/api/audits', auditRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/users', userRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/reports', reportsRouter);

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