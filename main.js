import path from "path";
import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import methodOverride from "method-override";
import pdf from "pdf-node";
import fs from "fs";
import { engine } from "express-handlebars";
import route from "./src/routers/index.js";
import connect from "./DB/connect.js";
import http from "http";

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = 3003;

import { Server } from "socket.io";
const server = http.createServer(app);
const server1 = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3002",
    methods: ["GET", "POST"],
  },
});
const io1 = new Server(server1, { port: 3002 });

io.on("connection", (socket) => {
  console.log("A new user connected to port 3002: ", socket.id);

  socket.on("send", (data) => {
    console.log("Received message on port 3002: ", data);
    io.sockets.emit("send", data);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected from port 3002: ", socket.id);
  });
});
io1.on("connection", (socket) => {
  console.log("A new user connected to port 3000: ", socket.id);

  socket.on("send", (data) => {
    console.log("Received message on port 3000: ", data);
    io1.sockets.emit("send", data);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected from port 3000: ", socket.id);
  });
});
server1.listen();

app.use(cookieParser());

app.use(express.static(path.join(__dirname, "src/public")));
app.use(express.static(path.join(__dirname, "uploads_doctor")));

app.use("/list_patient/", express.static(path.join(__dirname, "src/public")));
app.use("/chat/", express.static(path.join(__dirname, "src/public")));
app.use(
  "/add_patient_information/",
  express.static(path.join(__dirname, "src/public"))
);
app.use("/doctor/add_info", express.static(path.join(__dirname, "src/public")));
app.use(
  "/add_patient_information/:premise",
  express.static(path.join(__dirname, "src/public"))
);
app.use(
  "/download/:pat_id",
  express.static(path.join(__dirname, "src/public"))
);
app.use(
  "/download/prescription/:pat_id/:pre_id",
  express.static(path.join(__dirname, "src/public"))
);
app.use("/pay/examination", express.static(path.join(__dirname, "src/public")));
app.use("/docs", express.static(path.join(__dirname, "docs")));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(morgan("combined"));

app.engine(
  "hbs",
  engine({
    extname: ".hbs",
    helpers: {
      sum: (a, b) => a + b,
      eq: (a, b) => a === b,
    },
  })
);

app.use(methodOverride("_method"));

app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "src/resources/views"));

route(app);

server.listen(port, () => {
  connect();
  console.log(`app listening at http://localhost:${port}`);
});
