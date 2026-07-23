import { Server } from "socket.io";
import { registerChatEvents } from "./chat.socket.js";
// import { registerAICallEvents } from "./aiCall.socket.js";

let io;

const userSocketMap = new Map();

const initializeSocket = (server) => {

    io = new Server(server,{
        cors:{
            origin:process.env.CLIENT_URI,
            credentials:true
        }
    });

    io.on("connection",(socket)=>{

        socket.on("user-connected",(userId)=>{

            socket.userId=userId;

            userSocketMap.set(userId,socket.id);

            io.emit("online-users",[...userSocketMap.keys()]);
        });

        registerChatEvents(socket);

        // registerAICallEvents(socket);

        socket.on("disconnect",()=>{

            if(socket.userId &&
               userSocketMap.get(socket.userId)===socket.id){

                userSocketMap.delete(socket.userId);

                io.emit("online-users",[...userSocketMap.keys()]);
            }

        });

    });

};

export { initializeSocket, io, userSocketMap };