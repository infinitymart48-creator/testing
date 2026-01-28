

An online code editor and compiler supporting C, C++, Java, and Python.

## Features
- Monaco Editor
- Real-time input/output (stdin/stdout)
- Docker sandboxed execution
- WebSocket-based streaming
- Infinite loop & idle timeout protection

## Tech Stack
- Node.js
- Express
- WebSocket
- Docker
- Monaco Editor
- xterm.js

## How to Run Locally
```bash
npm install
docker build -t sandbox-cpp docker/cpp
docker build -t sandbox-c docker/c
docker build -t sandbox-python docker/python
docker build -t sandbox-java docker/java
node server.js
