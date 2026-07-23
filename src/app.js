import express from "express";
import cookieParser from 'cookie-parser'
import authRouter from './routes/auth.routes.js'
import userRouter from './routes/user.routes.js'
import messageRouter from './routes/message.routes.js'
import aiRouter from './routes/ai.routes.js'
import cors from "cors";
import errorHandler from './middlewares/error.middlware.js'

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URI, 
    credentials: true, 
}));

app.use(cookieParser());

app.use(express.json());

app.use("/api/auth", authRouter)

app.use("/api/user", userRouter)

app.use("/api/messages", messageRouter)

app.use("/api/ai", aiRouter)

app.use(errorHandler)


export {app}