import dotenv from "dotenv";
import userRoute from './router/userRoute.js';
import orgRoute from './router/orgRoute.js';
import taskRoute from './router/taskRoute.js';
import projectRoute from './router/projectRoute.js';
import commentRoute from './router/commentRoute.js';
import activitylog from './router/activitylogRoute.js';
import adminRoute from './router/adminRoute.js';
import notification from './router/notificationRoute.js';
import AppError from './utils/appError.js'
import express from "express";
import morgan from "morgan";
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()

app.use(express.json())
app.use(cookieParser())
app.use(morgan('dev'))
app.use(express.static('public'))

dotenv.config({ path: './.env' })
import './controllers/userController.js';

app.use(cors({
   origin: 'https://org-node.vercel.app',
   credentials: true
}))

app.get("/", (req, res) => {
   res.send("API is running ✅");
});

app.head("/", (req, res) => {
   res.status(200).send();
});
app.use('/api/users', userRoute)
app.use('/api/org', orgRoute)
app.use('/api/project', projectRoute)
app.use('/api/task', taskRoute)
app.use('/api/comment', commentRoute)
app.use('/api/activitylog', activitylog)
app.use('/api/notification', notification)
app.use('/api/admin', adminRoute)

app.all(/.*/, (req, res, next) => {
   next(new AppError(`Can't find ${req.originalUrl} on this server`, 404))
})

app.use((err, req, res, next) => {
   err.statusCode = err.statusCode || 500
   err.status = err.status || 'error'

   res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      stack: process.env.NODE_ENV = 'development' ? err.stack : undefined
   })
})

export default app 