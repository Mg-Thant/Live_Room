const express = require("express");
const socket = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const formatMSG = require("./utils/formatMSG");
const {
  getDisconnectUser,
  getSameRoomUsers,
  savedUsers,
} = require("./utils/user");
const Message = require("./models/message");
const messageRoute = require("./routes/message");

const app = express();

app.use(cors());

app.use(messageRoute);

mongoose.connect(process.env.MONGODB_URL).then(() => {
  console.log("Connected to database");
});

const server = app.listen(4000, () => {
  console.log("Server is running on port 4000");
});

const io = socket(server, {
  cors: "*",
});

// Run when client-server connected
io.on("connection", (socket) => {
  console.log("Client has connected!!");
  const BOT = "Room Manager Bot";

  // run user joined room
  socket.on("joined_room", ({ username, room }) => {
    console.log(username, room);
    savedUsers(socket.id, username, room);
    socket.join(room);

    // send joined message all user
    socket.emit("message", formatMSG(BOT, "Welcome to my world"));

    // send joined message all user except user owner
    socket.broadcast
      .to(room)
      .emit("message", formatMSG(BOT, `${username} has joined room...`));

    // listen sent message
    socket.on("send_message", (data) => {
      // send message
      io.to(room).emit("message", formatMSG(username, data));
      // store database
      Message.create({
        username,
        message: data,
        room,
      });
    });

    // send room users
    io.to(room).emit("room_users", getSameRoomUsers(room));
  });

  // listen disconnect
  socket.on("disconnect", () => {
    const user = getDisconnectUser(socket.id);
    // disconnect message to all user
    if (user) {
      io.to(user.room).emit(
        "message",
        formatMSG(BOT, `${user.username} has left the room...`)
      );
    io.to(user.room).emit("room_users", getSameRoomUsers(user.room));
    }
  });
});
