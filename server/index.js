import express from "express";
import logger from "morgan";
import { Server } from "socket.io";
import { createServer } from "node:http";
import cors from "cors";

const port = process.env.PORT ?? 80; // Cambiar esto si voy a probar en localhost
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://52.4.121.161",
    methods: ["GET", "POST"],
  },
});

app.use(express.json());

io.on("connection", (socket) => {
  console.log("Un cliente se ha conectado");

  // Escuchar cuando un usuario se conecta al tablero
  socket.on("user-connected", (data) => {
    const room = `project_${data.projectId}_sprint_${data.sprintId}`;
    socket.join(room); // Unirse a la sala específica del sprint
    console.log(`Usuario conectado a la sala ${room}`);
  });

  socket.on("task-updated", (data) => {
    const { taskId, newStatus, sprintId } = data;
    console.log(
      `Tarea ${taskId} actualizada a estado: ${newStatus} en sprint ${sprintId}`
    );

    // Emitir el cambio solo a los clientes conectados al sprint correspondiente
    socket.broadcast.emit("task-updated", {
      taskId,
      newStatus,
      sprintId, // Incluimos el sprintId para asegurarnos de que se actualice solo en el sprint correcto
    });
  });

  // Emitir solo a la sala correspondiente cuando un sprint es eliminado
  socket.on("sprint-deleted", (data) => {
    const { sprintId, projectId } = data;
    const room = `project_${projectId}_sprint_${sprintId}`; // Identificar la sala específica del sprint
    console.log(`Sprint ${sprintId} ha sido eliminado`);

    // Emitir el evento solo a los usuarios conectados al sprint eliminado
    socket.to(room).emit("sprint-deleted", { sprintId });
  });

  // Escuchar cuando una tarea es añadida
  socket.on("task-added", (data) => {
    const { taskId, name, status, description, projectId, sprintId } = data;
    console.log(
      `Nueva tarea añadida a proyecto ${projectId}, sprint ${sprintId}`
    );

    // Emitir el evento solo a los demás clientes conectados
    socket.broadcast.emit("task-added", {
      taskId,
      name,
      status,
      description,
      projectId,
      sprintId,
    });
  });

  // Escuchar cuando una tarea se actualiza en el backlog
  socket.on("task-backlog-updated", (data) => {
    const { taskId, name, status, description, sprintId } = data;
    console.log(
      `Tarea actualizada en el backlog: ${name}, en sprint ${sprintId}`
    );

    // Emitir el cambio solo a los clientes conectados al sprint correspondiente
    socket.broadcast.emit("task-backlog-updated", {
      taskId,
      name,
      status,
      description,
      sprintId, // Incluimos el sprintId para asegurarnos de que se actualice solo en el sprint correcto
    });
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

  // Escuchar cuando una tarea se elimina en el backlog (desde el update)
  socket.on("task-backlog-deleted", (taskId) => {
    console.log(`Tarea eliminada desde el backlog: ${taskId}`);

    // Emitir el cambio a todos los demás clientes conectados
    socket.broadcast.emit("task-backlog-deleted", taskId);
  });

  // Escuchar cuando una tarea cambia de sprint
  socket.on("task-sprint-changed", (data) => {
    const { taskId, oldSprintId, newSprintNumber } = data;
    console.log(
      `Tarea ${taskId} movida del sprint ${oldSprintId} al sprint ${newSprintNumber}`
    );

    // Emitir el evento 'task-sprint-changed' para que otros clientes conectados actualicen su UI
    socket.broadcast.emit("task-sprint-changed", data);
  });

  socket.on("task-modal-created", (data) => {
    const { taskId, name, description, status, priority, projectId, sprintId } =
      data;

    console.log(`Nueva tarea creada: ${name}, en el sprint ${sprintId}`);

    // Emitir el evento a los clientes conectados al proyecto correspondiente
    io.emit("task-modal-created", data);
  });

  // Escuchar cuando una tarea es añadida desde el Kanban
  socket.on("task-add-kanban", (data) => {
    const {
      taskId,
      name,
      description,
      status,
      priority,
      projectId,
      sprintId,
      sprintName,
    } = data;

    console.log(
      `Nueva tarea añadida desde Kanban: ${name}, en sprint ${sprintId}`
    );

    // Emitir el evento 'task-add-kanban' a todos los demás clientes conectados
    socket.broadcast.emit("task-add-kanban", {
      taskId,
      name,
      description,
      status,
      priority,
      projectId,
      sprintId,
      sprintName,
    });
  });
});

app.use(logger("dev"));

app.post("/task-added", (req, res) => {
  const { taskId, name, status, description, projectId, sprintId } = req.body;

  // Validar si todos los datos están presentes
  if (!taskId || !name || !status || !projectId || !sprintId) {
    return res.status(400).send({ success: false, message: "Faltan datos" });
  }

  console.log(
    `Nueva tarea añadida: ${name}, proyecto ${projectId}, sprint ${sprintId}`
  );

  // Emitir el evento 'task-added' a todos los clientes conectados
  io.emit("task-added", {
    taskId,
    name,
    status,
    description,
    projectId,
    sprintId,
  });

  // Enviar una respuesta de éxito
  res
    .status(200)
    .send({ success: true, message: "Tarea añadida y emitida correctamente" });
});

app.post("/task-backlog-updated", (req, res) => {
  const { taskId, name, status, description, projectId, sprintId } = req.body;

  // Validar si todos los datos están presentes
  if (!taskId || !name || !status || !projectId || !sprintId) {
    return res.status(400).send({ success: false, message: "Faltan datos" });
  }

  console.log(
    `Tarea actualizada: ${name}, proyecto ${projectId}, sprint ${sprintId}`
  );

  // Emitir el evento 'task-backlog-updated' a todos los clientes conectados
  io.emit("task-backlog-updated", {
    taskId,
    name,
    status,
    description,
    projectId,
    sprintId,
  });

  // Enviar una respuesta de éxito
  res.status(200).send({
    success: true,
    message: "Tarea actualizada y emitida correctamente",
  });
});

app.post("/task-backlog-deleted", (req, res) => {
  const { taskId } = req.body;

  if (!taskId) {
    return res.status(400).send({ success: false, message: "Faltan datos" });
  }

  console.log(`Tarea eliminada del backlog: ${taskId}`);

  // Emitir el evento 'task-backlog-deleted' a todos los clientes conectados
  io.emit("task-backlog-deleted", taskId);

  res.status(200).send({
    success: true,
    message: "Tarea eliminada y emitida correctamente",
  });
});

// Enviar el evento de eliminación del sprint
app.post("/sprint-deleted", (req, res) => {
  const { sprintId } = req.body;

  if (!sprintId) {
    return res
      .status(400)
      .send({ success: false, message: "Falta el ID del sprint" });
  }

  console.log(`Sprint ${sprintId} ha sido eliminado`);

  // Emitir el evento 'sprint-deleted' a todos los clientes conectados
  io.emit("sprint-deleted", { sprintId });

  res.status(200).send({
    success: true,
    message: "Sprint eliminado y emitido correctamente",
  });
});

app.post("/task-sprint-changed", (req, res) => {
  const { taskId, oldSprintId, newSprintId } = req.body;

  if (!taskId || !oldSprintId || !newSprintId) {
    return res.status(400).send({
      success: false,
      message: "Faltan datos para el cambio de sprint",
    });
  }

  console.log(
    `Tarea ${taskId} movida del sprint ${oldSprintId} al nuevo sprint ${newSprintId}`
  );

  // Emitir el evento 'task-sprint-changed' a todos los clientes conectados
  io.emit("task-sprint-changed", {
    taskId,
    oldSprintId,
    newSprintId,
  });

  res.status(200).send({
    success: true,
    message: "Cambio de sprint emitido correctamente",
  });
});

// Habilitar CORS para todas las solicitudes
app.use(
  cors({
    origin: "http://52.4.121.161",
    methods: ["GET", "POST"],
  })
);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

server.listen(port, () => {
  console.log(`Server is running on http://52.4.121.161:${port}`);
});
