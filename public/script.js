const ws = new WebSocket("ws://localhost:3000");

const term = new Terminal({
  cursorBlink: true,
  disableStdin: true, // 🔒 LOCK terminal editing
  convertEol: true,
  theme: {
    background: "#000000",
    foreground: "#00ff00"
  }
});

term.open(document.getElementById("terminal"));

let isRunning = false;

// ---- Output from backend ----
ws.onmessage = (e) => {
  term.write(e.data);
};

// ---- Keyboard handling (ONLY place input is handled) ----
// term.onKey(({ key, domEvent }) => {
//   if (!isRunning) return;

//   domEvent.preventDefault();

//   // ✅ ENTER (ONLY when key is '\r')
//   if (key === "\r") {
//     term.write("\r\n");
//     ws.send(JSON.stringify({ type: "input", value: "\n" }));
//     return;
//   }

//   // ✅ BACKSPACE
//   if (key === "\x7f") {
//     term.write("\b \b");
//     return;
//   }

//   // ❌ Ignore escape sequences (arrows, etc.)
//   if (key.startsWith("\x1b")) {
//     return;
//   }

//   // ✅ Printable characters ONLY
//   if (key.length === 1) {
//     term.write(key);
//     ws.send(JSON.stringify({ type: "input", value: key }));
//   }
// });


let inputBuffer = "";

term.onKey(({ key, domEvent }) => {
  if (!isRunning) return;

  domEvent.preventDefault();

  // ENTER → send full line
  if (key === "\r") {
    term.write("\r\n");
    ws.send(JSON.stringify({
      type: "input",
      value: inputBuffer + "\n"
    }));
    inputBuffer = "";
    return;
  }

  // BACKSPACE (robust)
  if (
    key === "\x7f" ||
    key === "\b" ||
    domEvent.key === "Backspace"
  ) {
    if (inputBuffer.length > 0) {
      inputBuffer = inputBuffer.slice(0, -1);
      term.write("\b \b");
    }
    return;
  }

  // Ignore arrows, ctrl, etc.
  if (key.length !== 1) return;

  // Printable characters
  inputBuffer += key;
  term.write(key);
});







// ---- Run button ----
function run() {
  term.reset();
  isRunning = true;

  ws.send(JSON.stringify({
    type: "run",
    code: document.getElementById("code").value
  }));

  term.focus();
}

