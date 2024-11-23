const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require('bcrypt');
const { resourceUsage } = require("process");
const { request } = require("http");

const app = express();
const PORT = 3000;
const SALT_ROUNDS = 10;

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
    session({
        secret: "replace_this_with_a_secure_key",
        resave: false,
        saveUninitialized: true,
    })
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const USERS = [
    {
        id: 1,
        username: "AdminUser",
        email: "admin@example.com",
        password: bcrypt.hashSync("admin123", SALT_ROUNDS), //In a database, you'd just store the hashes, but for 
                                                            // our purposes we'll hash these existing users when the 
                                                            // app loads
        role: "admin",
    },
    {
        id: 2,
        username: "RegularUser",
        email: "user@example.com",
        password: bcrypt.hashSync("user123", SALT_ROUNDS),
        role: "user", // Regular user
    },
];

app.post("/logout", (request, response) =>{
    request.session.destroy(() => {

        response.render("index")
    });
    
});

// GET /login - Render login form
app.get("/login", (request, response) => {
    response.render("login");
});

// POST /login - Allows a user to login
app.post("/login", (request, response) => {
    const {email, password} = request.body;
    const user = USERS.find((u)=>u.email === email);
   

    if (!user) {
        return response.render("login", {errorMessage: "Invalid credentials."});
    }

    const validPassword = bcrypt.compareSync(password, user.password);

    if (!validPassword){
        return response.render("login", {errorMessage: "Invalid credentials."});
    }


    request.session.user = user;
    response.redirect('/landing')

    
});

// GET /signup - Render signup form
app.get("/signup", (request, response) => {
    response.render("signup");
});

// POST /signup - Allows a user to signup
app.post("/signup", (request, response) => {
    const newName = request.body.username;
    const newEmail = request.body.email;
    const newPassword = request.body.password;
    const newID = Math.max(...USERS.map(user => user.id)) + 1;
    const newUser = {
        id:newID,
        username: newName,
        email: newEmail,
        password:bcrypt.hashSync(newPassword, SALT_ROUNDS),
        role:"user"
    }

    USERS.push(newUser)
    console.log(USERS)
    response.render("signup", {successMessage: "Your account has been made"});

});

// GET / - Render index page or redirect to landing if logged in
app.get("/", (request, response) => {
    if (request.session.user) {
        return response.redirect("/landing");
    }
    response.render("index");
});

// GET /landing - Shows a welcome page for users, shows the names of all users if an admin
app.get("/landing", (request, response) =>{
    const username = request.session.user.username
    const role = request.session.user.role
    const userList = USERS
    response.render("landing", {username, role, userList});
    
});



// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
