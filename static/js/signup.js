var formbtns = document.getElementById("btns");
var signupbtn = document.getElementById("signup");
var signupform = document.getElementById("signup-form");
var usernameele = document.getElementById("username");
var passwordele = document.getElementById("password");
var faildia = document.getElementById("fail");

function wrapsignup() {
    if (formbtns.offsetTop === signupbtn.offsetTop) {
        signupbtn.classList.remove("wrapped");
    } else {
        signupbtn.classList.add("wrapped");
    }
}
window.addEventListener("load", wrapsignup);
window.addEventListener("resize", wrapsignup);

function home() {
    location.pathname = "/";
}

function showpass() {
    if (passwordele.type === "password") passwordele.type = "text";
    else passwordele.type = "password";
}


signupform.addEventListener("submit", async (ev) => {
    ev.preventDefault();

    let username = usernameele.value;
    let password = passwordele.value;

    // let res = await fetch(`/adduser`);
    let res = await fetch(`/adduser?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`, {
        method: "POST",
    })

    if (!res.ok) {
        faildia.showModal();
        return;
    }

    home();
})