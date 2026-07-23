import connectDB from "./db/db_connect.js";
import "dotenv/config";
import { app } from "./app.js";
import http from "http";
import { initializeSocket } from "./socket/socket.js";
import { initializeAiSocket } from "./socket/ai.socket.js"

const server = http.createServer(app)

initializeSocket(server)
initializeAiSocket(server)

connectDB()
.then(() =>(
    server.listen(process.env.PORT, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    })
))
.catch((error) => {
    console.error("Error starting the server:", error);
})

