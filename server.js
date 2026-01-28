const express = require("express");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const WebSocket = require("ws");
const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("testing"));

app.get("/home", (req, res) => {
    const homepage = path.join(__dirname, "testing", "home.html");
    res.sendFile(homepage)
})
app.get("/contest", (req, res) => {
    const contest = path.join(__dirname, "testing", "index.html");
    res.sendFile(contest)
})
app.get("/login", (req, res) => {
    const loginpage = path.join(__dirname, "testing", "login.html");
    res.sendFile(loginpage)
})

const server = app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});

const wss = new WebSocket.Server({ server });

const LANG_CONFIG = {
  cpp: {
    image: "sandbox-cpp",
    filename: "main.cpp"
  },
  c: {
    image: "sandbox-c",
    filename: "main.c"
  },
  python: {
    image: "sandbox-python",
    filename: "main.py"
  },
  java: {
    image: "sandbox-java",
    filename: "Main.java"
  }
};


wss.on("connection", (ws) => {
  let dockerProcess = null;

  ws.on("message", (msg) => {
    const data = JSON.parse(msg);

    
    if (data.type === "run") {
      if (dockerProcess) {
        dockerProcess.kill("SIGKILL");
        dockerProcess = null;
      }

      const lang = data.language || "cpp";
      const config = LANG_CONFIG[lang];
      if (!config) {
        ws.send("Unsupported language\n");
        return;
      }

      const runId = Date.now().toString();
      const runDir = path.join(__dirname, "docker", "runs", runId);
      fs.mkdirSync(runDir, { recursive: true });

      fs.writeFileSync(
        path.join(runDir, config.filename),
        data.code
      );

      dockerProcess = spawn("docker", [
        "run",
        "--rm",
        "-i",
        "--memory=128m",
        "--memory-swap=128m",
        "-v", `${runDir}:/app`,
        "-w", "/app",
        config.image
      ]);

      dockerProcess.stdout.on("data", d => ws.send(d.toString()));
      dockerProcess.stderr.on("data", d => ws.send(d.toString()));

      dockerProcess.on("close", () => {
        ws.send("\n[Program finished]");
        dockerProcess = null;
        fs.rmSync(runDir, { recursive: true, force: true });
      });
    }

    // inout lena from the user and sent this to docker 
    if (data.type === "input" && dockerProcess) {
      dockerProcess.stdin.write(data.value);
    }
  });

  ws.on("close", () => {
    if (dockerProcess) dockerProcess.kill("SIGKILL");
  });
});


app.post("/contact", (req, res) => {
    const { from_name, from_email, subject, message } = req.body;
    let users=[]
    console.log("📩 Contact Form Data:");
    console.log(req.body);
    if(fs.existsSync("contact.json")){
         const filedata = fs.readFileSync("sigup.json", "utf-8");
         users = filedata ? JSON.parse(filedata) : [];
    }
    users.push({
        from_name,
        from_email,
        subject,
        message
    })

    
    fs.writeFileSync("contact.json", JSON.stringify(users, null, 2));
    
    res.json({
        success: true,
        message: "Message received successfully"
    });
});

app.post("/loginsuck", (req, res) => {
    const { email, password } = req.body;

    console.log("📩 login Data:");
    console.log(req.body);

    fs.readFile("sigup.json", "utf-8", (err, filedata) => {
        if (err) {
            console.log(err)
        } else {
            const users = filedata ? JSON.parse(filedata) : [];
            const user = users.find(u => u.user_email === email && u.user_password === password)
            if (user) {
                res.json({
                    success: true,
                    message: "Login successful",
                    user: {
                        name: user.user_name,
                        email: user.user_email
                    }
                });
            } else {
                res.json({
                    success: false,
                    message: "Invalid email or password"
                });
            }
            // console.log("file reade successfully")
            // console.log(filedata)
            // res.json({
            //     data:JSON.parse(filedata),
            //     success: true,
            //     message: "Message received successfully"
            // });
        }
    })


    
});



app.post("/signup", (req, res) => {

    const { user_name, user_email, user_password, user_confirmpassword } = req.body;

    let users = [];

    if (fs.existsSync("sigup.json")) {
        const fileData = fs.readFileSync("sigup.json", "utf-8");
        users = fileData ? JSON.parse(fileData) : [];
    }


    users.push({
        user_name,
        user_email,
        user_password,
        user_confirmpassword
    });


    fs.writeFileSync("sigup.json", JSON.stringify(users, null, 2));

    res.json({

        success: true,
        message: "Signup successful"
    });
});