const express = require("express");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const WebSocket = require("ws");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("testing", { index: "home.html" }));

app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "testing", "home.html"))
);
app.get("/contest", (req, res) =>
  res.sendFile(path.join(__dirname, "testing", "index.html"))
);
app.get("/login", (req, res) =>
  res.sendFile(path.join(__dirname, "testing", "login.html"))
);

const server = app.listen(3000, () =>
  console.log("🚀 Server running on http://localhost:3000")
);

const wss = new WebSocket.Server({ server });

const LANG_CONFIG = {
  cpp: { image: "sandbox-cpp", filename: "main.cpp" },
  c: { image: "sandbox-c", filename: "main.c" },
  python: { image: "sandbox-python", filename: "main.py" },
  java: { image: "sandbox-java", filename: "Main.java" }
};

wss.on("connection", (ws) => {
  let dockerProcess = null;
  let execTimer = null;
  let inputTimer = null;
  let waitingForInput = false;

  const startExecTimer = () => {
    clearTimeout(execTimer);
    execTimer = setTimeout(() => {
      if (dockerProcess) {
        dockerProcess.kill("SIGKILL");
        ws.send(
          "\n⛔ Program terminated\nReason: Time limit exceeded (possible infinite loop)\n"
        );
        dockerProcess = null;
      }
    }, 5000); // execution time
  };

  const startInputTimer = () => {
    clearTimeout(inputTimer);
    inputTimer = setTimeout(() => {
      if (dockerProcess) {
        dockerProcess.kill("SIGKILL");
        ws.send(
          "\n⛔ Program terminated\nReason: Input timeout (no input provided)\n"
        );
        dockerProcess = null;
      }
    }, 60000); // input wait time
  };

  const clearAllTimers = () => {
    clearTimeout(execTimer);
    clearTimeout(inputTimer);
    execTimer = null;
    inputTimer = null;
  };

  ws.on("message", (msg) => {
    const data = JSON.parse(msg);

    /* ===== RUN ===== */
    if (data.type === "run") {
      if (dockerProcess) dockerProcess.kill("SIGKILL");
      clearAllTimers();

      const config = LANG_CONFIG[data.language || "cpp"];
      if (!config) {
        ws.send("❌ Unsupported language\n");
        return;
      }

      const runDir = path.join(__dirname, "docker", "runs", Date.now().toString());
      fs.mkdirSync(runDir, { recursive: true });
      fs.writeFileSync(path.join(runDir, config.filename), data.code);

      dockerProcess = spawn("docker", [
        "run",
        "--rm",
        "-i",

        "--memory=128m",
        "--memory-swap=128m",
        "--pids-limit=64",
        "--network=none",

        "-v", `${runDir}:/app`,
        "-w", "/app",
        config.image
      ]);

      waitingForInput = true;
      startInputTimer();   // user must type
      startExecTimer();    // but execution also limited

      dockerProcess.stdout.on("data", (d) => {
        ws.send(d.toString());
        waitingForInput = true;
        clearTimeout(execTimer); // pause execution timer
      });

      dockerProcess.stderr.on("data", (d) => {
        ws.send(d.toString());
        clearTimeout(execTimer);
      });

      dockerProcess.on("close", () => {
        clearAllTimers();
        ws.send("\n[Program finished]");
        dockerProcess = null;
        fs.rmSync(runDir, { recursive: true, force: true });
      });
    }

    /* ===== INPUT ===== */
    if (data.type === "input" && dockerProcess) {
      dockerProcess.stdin.write(data.value);
      waitingForInput = false;

      clearTimeout(inputTimer);
      startExecTimer(); // resume execution
    }
  });

  ws.on("close", () => {
    if (dockerProcess) dockerProcess.kill("SIGKILL");
    clearAllTimers();
  });
});
