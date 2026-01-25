const terminal = document.getElementById("terminal");
const cursor = document.getElementById("cursor");
const codeEditor = document.getElementById("code");
const ws = new WebSocket("ws://localhost:3000");

let inputBuffer = "";
let isRunning = false;
let terminalFocused = false;

// --- Helper to print output BEFORE cursor ---
function printToTerminal(text) {
  cursor.remove();
  terminal.textContent += text;
  terminal.appendChild(cursor);
  terminal.scrollTop = terminal.scrollHeight;
}

// --- WebSocket output ---
ws.onmessage = (e) => {
  printToTerminal(e.data);
};

// --- Run button ---
function run() {
  terminal.textContent = "";
  inputBuffer = "";
  isRunning = true;

  ws.send(JSON.stringify({
    type: "run",
    code: codeEditor.value
  }));

  terminal.appendChild(cursor);
  terminal.focus();
}

// --- Focus handling ---
terminal.addEventListener("focus", () => {
  terminalFocused = true;
  cursor.classList.remove("hidden");
});

terminal.addEventListener("blur", () => {
  terminalFocused = false;
  cursor.classList.add("hidden");
});

// --- Keyboard input ONLY when terminal focused ---
document.addEventListener("keydown", (e) => {
  if (!isRunning || !terminalFocused) return;

  if (e.key === "Enter") {
    printToTerminal("\n");

    ws.send(JSON.stringify({
      type: "input",
      value: inputBuffer + "\n"
    }));

    inputBuffer = "";
    e.preventDefault();
  }
  else if (e.key === "Backspace") {
    if (inputBuffer.length > 0) {
      inputBuffer = inputBuffer.slice(0, -1);
      terminal.textContent = terminal.textContent.slice(0, -1);
      terminal.appendChild(cursor);
    }
    e.preventDefault();
  }
  else if (e.key.length === 1) {
    inputBuffer += e.key;
    printToTerminal(e.key);
    e.preventDefault();
  }
});
