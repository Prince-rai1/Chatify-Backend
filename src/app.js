import express from "express";
import cookieParser from 'cookie-parser'
import authRouter from './routes/auth.routes.js'
import userRouter from './routes/user.routes.js'
import messageRouter from './routes/message.routes.js'
import cors from "cors";
import errorHandler from './middlewares/error.middlware.js'

const app = express();

app.use(cors({
    origin: "http://localhost:5173", 
    credentials: true, 
}));

app.use(cookieParser());

app.use(express.json());

app.use("/api/auth", authRouter)

app.use("/api/user", userRouter)

app.use("/api/messages", messageRouter)

app.use(errorHandler)

// app.use(cors());


export {app}