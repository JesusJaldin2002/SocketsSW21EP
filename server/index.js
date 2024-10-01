import express from "express";
import logger from "morgan";
import { Server } from "socket.io";
import { createServer } from "node:http";
import cors from "cors";

const port = process.env.PORT ?? 4444; // Cambiar esto si voy a probar en localhost
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://192.168.0.11:8000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("Un cliente se ha conectado");

    // Escuchar cuando un usuario se conecta al tablero
    socket.on("user-connected", (data) => {
        console.log(
          `Usuario conectado a proyecto ${data.projectId}, sprint ${data.sprintId}`
        );
      });

  // Escuchar cuando una tarea se actualiza
  socket.on("task-updated", (data) => {
    const { taskId, newStatus } = data;
    console.log(`Tarea ${taskId} actualizada a estado: ${newStatus}`);

    // Emitir el cambio a todos los demás clientes conectados
    socket.broadcast.emit("task-updated", data);
  });

  // Escuchar cuando una tarea se elimina
  socket.on("task-deleted", (taskId) => {
    console.log(`Tarea ${taskId} eliminada`);

    // Emitir el cambio a todos los demás clientes conectados
    socket.broadcast.emit("task-deleted", taskId);
  });

  // Al desconectarse
  socket.on("disconnecting", () => {
    console.log("Desconectando cliente");
  });

  socket.on("disconnect", () => {
    console.log("Un cliente se ha desconectado");
  });
});

app.use(logger("dev"));

// Habilitar CORS para todas las solicitudes
app.use(
  cors({
    origin: "http://192.168.0.11:8000",
    methods: ["GET", "POST"],
  })
);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
