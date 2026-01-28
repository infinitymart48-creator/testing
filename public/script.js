const ws = new WebSocket("ws://localhost:3000");

const term = new Terminal({
  cursorBlink: true,
  disableStdin: true,
  convertEol: true,
  theme: {
    background: "#000000",
    foreground: "#00ff00"
  }
});

term.open(document.getElementById("terminal"));

let isRunning = false;

ws.onmessage = (e) => {
  term.write(e.data);
};

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

function run() {
  term.reset();
  isRunning = true;

  ws.send(JSON.stringify({
    type: "run",
    language: document.getElementById("language").value,
    code: document.getElementById("code").value
  }));

  term.focus();
}
