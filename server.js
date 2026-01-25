const express = require("express");
const fs = require("fs");
const path = require("path");
const { spawn, exec } = require("child_process");
const WebSocket = require("ws");

const app = express();
app.use(express.static("public"));

const server = app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  let program = null;

  ws.on("message", (msg) => {
    const data = JSON.parse(msg);

    // 1️⃣ Compile & Run
    if (data.type === "run") {
      fs.writeFileSync("temp/main.cpp", data.code);

      exec("g++ temp/main.cpp -o temp/main", (err, stdout, stderr) => {
        if (err) {
          ws.send(stderr);
          return;
        }

        program = spawn("./temp/main");

        program.stdout.on("data", (d) => {
          ws.send(d.toString());
        });

        program.stderr.on("data", (d) => {
          ws.send(d.toString());
        });

        program.on("close", () => {
          ws.send("\n[Program finished]");
        });
      });
    }

    // 2️⃣ Handle stdin
    if (data.type === "input" && program) {
      program.stdin.write(data.value);
    }
  });

  ws.on("close", () => {
    if (program) program.kill();
  });
});
