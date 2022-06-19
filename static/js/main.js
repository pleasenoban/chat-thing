// monkey patch nhìn cho đẹp
String.prototype.isEmpty = function () {
    return (this.length === 0 || !this.trim());
};
var socket = io();
var messages = document.getElementById('messages');
var form = document.getElementById('form');
var input = document.getElementById('input');
var channelsele = document.getElementById("channels");
var adddia = document.getElementById("addchannel");
var addinput = document.getElementById("addchannelin");
var formdia = document.getElementById("formdia");
var notisound = new Audio("/static/mp3/noti.mp3");
var canplay = false;
var userinfo = JSON.parse(localStorage.getItem("user"));

document.getElementById("userwel").textContent = `welcome, ${userinfo.username}`;

function home() {
    location.pathname = "/";
}

if (userinfo !== null) {
    fetch(`/validuser?username=${encodeURIComponent(userinfo.username)}&password=${encodeURIComponent(userinfo.password)}`, {
        method: "POST",
    }).then((res) => {
        if (!res.ok) {
            localStorage.removeItem("user");
            home();
        }
    });
}

if (userinfo.remember === "no") {
    localStorage.removeItem("user");
}

function logout() {
    localStorage.removeItem("user");
    home();
}

function enablenoti() {
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === 'visible') {
            canplay = false;
        } else {
            canplay = true;
        }
    });
    document.removeEventListener("click", enablenoti);
}
document.addEventListener("click", enablenoti);

function showModal() {
    adddia.showModal();
}

function add() {
    addChannel(addinput.value);
    addinput.value = "";
    formdia.submit();
}

function can() {
    addinput.value = "";
    formdia.submit();
}

addinput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        add();
    }
})

function getRandomColor() {
    let h = Math.floor(Math.random() * 360),
        s = Math.floor(Math.random() * 100) + '%',
        l = Math.floor(Math.random() * 60) + '%';
    return `hsl(${h},${s},${l})`;
};

async function getChannels() {
    let res = await fetch("/getchannels", {
        method: "POST",
    });
    let json = await res.json();
    return json.channels;
}

function changeChannel(name) {
    if (document.title === name + " - chat") return;
    document.title = name + " - chat";
    socket.emit("join", {username: userinfo.username, password: userinfo.password, name: name});
    messages.innerHTML = "";
}

async function addChannel(name) {
    if (name.isEmpty()) return;
    await fetch("/addchannel?name=" + encodeURIComponent(name), {
        method: "POST",
    })
}

function setChannels(channels) {
    channelsele.innerHTML = "";
    channels.forEach(channel => {
        let button = document.createElement("button");
        button.className = "channel";
        button.textContent = channel;
        button.onclick = () => changeChannel(channel);
        channelsele.append(button);
    });
}

getChannels().then((channels) => {
    setChannels(channels);
})

function addmsg(msg) {
    let item = document.createElement('li');
    item.style.backgroundColor = getRandomColor();
    item.textContent = msg;
    if (msg.startsWith(`${userinfo.username}: `)) item.style.alignSelf = "flex-end";
    messages.appendChild(item);
    messages.scrollTo(0, messages.scrollHeight);
}
form.addEventListener('submit', (e) => {
    e.preventDefault();
    let msg = input.value;
    socket.emit("msg", msg);
    addmsg(`${userinfo.username}: ${msg}`);
    input.value = "";
});

socket.io.on("reconnect", () => {
    socket.emit("join", {username: userinfo.username, password: userinfo.password, name: document.title.slice(0, -7)});
    messages.innerHTML = "";
});

socket.on("msg", (msg) => {
    addmsg(msg);
    if (canplay && notisound.paused) {
        // will add noti request later
        notisound.play();
    }
});

socket.on("channelchange", () => {
    getChannels().then((channels) => {
        setChannels(channels);
    })
})

changeChannel("default");