var formbtns = document.getElementById("btns");
var signupbtn = document.getElementById("signin");
var signinform = document.getElementById("login-form");
var usernameele = document.getElementById("username");
var passwordele = document.getElementById("password");
var remele = document.getElementById("rem");
var faildia = document.getElementById("fail");

function wrapsignup() {
    if (formbtns.offsetTop === signupbtn.offsetTop) {
        signupbtn.classList.remove("wrapped");
    } else {
        signupbtn.classList.add("wrapped");
    }
}

function home() {
    location.pathname = "/";
}

function main() {
    location.pathname = "/main.html";
}

function showpass() {
    if (passwordele.type === "password") passwordele.type = "text";
    else passwordele.type = "password";
}

if (localStorage.getItem("user") !== null) {
    let user = JSON.parse(localStorage.getItem("user"));

    fetch(`/validuser?username=${encodeURIComponent(user.username)}&password=${encodeURIComponent(user.password)}`, {
        method: "POST",
    }).then((res) => {
        if (res.ok) {
            main();
            return;
        }
        localStorage.removeItem("user");
    });

}

window.addEventListener("load", wrapsignup);
window.addEventListener("resize", wrapsignup);

signinform.addEventListener("submit", async (ev) => {
    ev.preventDefault();

    let username = usernameele.value.replace(" ", "_");
    let password = passwordele.value;
    let remchecked = remele.checked;

    let res = await fetch(`/validuser?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`, {
        method: "POST",
    })

    if (!res.ok) {
        faildia.showModal();
        return;
    }

    let userinfo = {
        username: username,
        password: password,
        remember: remchecked ? "yes" : "no",
    }

    localStorage.setItem("user", JSON.stringify(userinfo));

    main();
})