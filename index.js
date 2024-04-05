const express = require("express");
const http = require("http");
const cors = require("cors");
require("dotenv").config(); //read environment variables
const cookieParser = require("cookie-parser");
const PORT = process.env.PORT || 5000;
const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    optionSuccessStatus: 200,
  })
);
app.use(express.json()); //accept json data with post requests
app.use(cookieParser());

const docRoutes = require("./routes/DocRoutes");
// const { WebSocket } = require("ws");
app.get("/", (req, res) => {
  res.send("Healthy");
});
app.use("/doc", docRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

const WebSocket = require("ws");
const wss = new WebSocket.Server({ noServer: true });
const setupWSConnection =
  require("./Providers/SocketProvider").setupWSConnection;

// const host = process.env.HOST || 'localhost'
// const port = 1235

const server = http.createServer(app);
const encoding = require("lib0/dist/encoding.cjs");
const decoding = require("lib0/dist/decoding.cjs");
const messageListener = (message) => {
  try {
    const encoder = encoding.createEncoder();
    // console.log(typeof message, message);
    message = new Uint8Array(message);
    const decoder = decoding.createDecoder(message);
    const messageType = decoding.readVarUint(decoder);
    const messageData = decoding.readVarString(decoder);
    console.log(messageType, messageData);
    
  } catch (err) {
    console.error(err);
  }
};
try {
  wss.on("connection", setupWSConnection);

  server.on("upgrade", (request, socket, head) => {
    const handleAuth = (ws) => {
      // ws.binaryType = "arraybuffer";
      // ws.send(JSON.stringify({ type: "message", data: "data" }));
      // ws.on("message", function message(message) {
      //   console.log(message);
      //   messageListener(message);
      //   // console.log("received: %s", message);
      // });
      wss.emit("connection", ws, request);
    };
    wss.handleUpgrade(request, socket, head, handleAuth);
  });
} catch (err) {
  console.log(err);
}

// server.listen(port, host, () => {
//   console.log(`running at '${host}' on port ${port}`)
// })

server.listen(PORT, () => {
  console.log("server listening on port: ", PORT);
});
