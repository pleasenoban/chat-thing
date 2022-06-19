const config = require("./config.json");
const http = require('http');
const express = require("express");
const { Server } = require("socket.io");
const fs = require("fs");
const JSONdb = require('simple-json-db');

try {
    var channels = require("./msgs.json");
} catch (err) {
    var channels = { "default": [] };
}

const port = config.port || 8080;
const cachelen = config.cache || 50;
const signals = ["SIGINT", "SIGTERM"];
const saveEnabled = config.save || true;

const users = new JSONdb(__dirname + "/users.json", { asyncWrite: true, syncOnWrite: true, jsonSpaces: 0 });

const app = express();

app.set('query parser', (qs) => {
    return new URLSearchParams(qs);
})
app.use("/static", express.static("static"));
app.use("/", express.static("pages"));
app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).send("pls no i have to fix da server");
})

const server = http.createServer(app);
const io = new Server(server);

// monkey patching go brr
Array.prototype.pushMsg = function (item) {
    if (this.length > cachelen) {
        this.shift();
        this.push(item);
        return;
    }
    this.push(item);
}
String.prototype.isEmpty = function () {
    return (this.length === 0 || !this.trim());
};

io.sockets.on("connection", (socket) => {
    let roomname;
    let user;

    socket.on("join", (dataobj) => {
        if (channels.hasOwnProperty(dataobj.name)) {
            if (!users.has(dataobj.username)) return;
            if (users.get(dataobj.username) !== dataobj.password) return;
            user = dataobj.username;
            socket.leave(roomname);
            socket.join(dataobj.name);
            roomname = dataobj.name;
            channels[roomname].forEach(msg => {
                socket.emit("msg", msg);
            });
        }
    })
    socket.on("msg", (msg) => {
        let mesg = `${user}: ${msg.substring(0, 300)}`
        socket.to(roomname).emit("msg", mesg);
        channels[roomname].pushMsg(mesg);
    })
})

app.post("/getchannels", (req, res) => {
    let channelsarr = [];
    for (let [key, value] of Object.entries(channels)) {
        channelsarr.push(key);
    }
    res.status(200).json({ channels: channelsarr });
})

app.post("/addchannel", (req, res) => {
    if (!req.query.has("name")) {
        res.status(400).send("bad request");
        return;
    };

    let channel = req.query.get("name");

    if (channels.hasOwnProperty(channel)) {
        res.status(400).send("channel already exists");
    };

    channels[channel] = [];
    io.emit("channelchange", "");

    res.status(200).send("successful");
})

app.post("/adduser", async (req, res) => {
    if (!(req.query.has("username") && req.query.has("password"))) {
        res.status(400).send("bad request");
        return;
    };

    let username = req.query.get("username").replaceAll(" ", "_");
    let password = req.query.get("password");

    if (username.isEmpty() || password.isEmpty() || username.length > 30 || password.length > 50) {
        res.status(400).send("bad request");
    };

    if (users.has(username)) {
        res.status(400).send("user is already created");
    };

    // todo: add hashing
    users.set(username, password);
    res.status(200).send("successful");
})

app.post("/validuser", (req, res) => {
    if (!(req.query.has("username") && req.query.has("password"))) {
        res.status(400).send("bad request");
        return;
    }
    let username = req.query.get("username");
    let password = req.query.get("password");

    if (users.has(username)) {
        if (users.get(username) === password) {
            res.status(200).send("has user");
            return;
        }
    }

    res.status(400).send("not an user")
})

server.listen(port, () => {
    console.log("server listening on port", port);
})

// quá lười để viết error handling => auto error handling go brrr
process.on('unhandledRejection', (reason, promise) => console.log(`${reason} --- ${promise}`));
process.on('uncaughtException', (err) => console.error(`uncaught exception: ${err}`));
process.on('error', (err) => console.log(`error: ${err}`));

if (saveEnabled) {
    signals.forEach((signal) => {
        process.on(signal, () => {
            console.log("writing msgs to file");
            fs.writeFileSync(__dirname + "/msgs.json", JSON.stringify(channels));
            process.exit();
        })
    })
}