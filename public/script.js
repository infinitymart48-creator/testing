const terminal = document.getElementById("terminal");
const ws = new WebSocket("ws://localhost:3000");

let inputBuffer = "";   // ✅ stores only user input

ws.onmessage = (e) => {
  terminal.textContent += e.data;
  terminal.scrollTop = terminal.scrollHeight;
};

function run() {
  terminal.textContent = "";
  inputBuffer = "";
  ws.send(JSON.stringify({
    type: "run",
    code: document.getElementById("code").value
  }));
}

// ✅ Capture ONLY what user types
terminal.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();

    terminal.textContent += "\n";

    ws.send(JSON.stringify({
      type: "input",
      value: inputBuffer + "\n"
    }));

    inputBuffer = "";
  } 
  else if (e.key === "Backspace") {
    inputBuffer = inputBuffer.slice(0, -1);
  } 
  else if (e.key.length === 1) {
    inputBuffer += e.key;
    terminal.textContent += e.key;
  }
});

