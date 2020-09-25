require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const e = require('express');

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({
    secret: 'Out little secret.',
    resave: false,
    saveUninitialized: false,
    //   cookie: { secure: true }
}))

app.use(passport.initialize());
app.use(passport.session());

const uri = "mongodb+srv://Andrew:blackwing1@cluster0.yzts9.mongodb.net/userDB?retryWrites=true&w=majority"
// mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.set('useCreateIndex', true)

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
});

userSchema.plugin(passportLocalMongoose);

// const secret = "Thisisoutlittlesecret";
// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] });

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

passport.use(User.create)

app.get("/", function (req, res) {
    User.find({}, function (err, users) {
        if (err) {
            console.log(err)
        } else {
            // console.log(users)
            res.render("home", {users: users})
        }
    })
});

app.get("/login", function (req, res) {
    res.render("login");
});

app.get("/secrets", function (req, res) {
    User.find({ "secrets": { $ne: null } }, function (err, foundUsers) {
        if (err) {
            console.log(err)
        } else {
            if (foundUsers) {
                res.render("secrets", { usersWithSecrets: foundUsers });
            }
        }
    })
});

app.get("/register", function (req, res) {
    res.render("register");
});

app.get("/logout", function (req, res) {
    req.logOut();
    res.redirect("/");
});

app.post("/register", function (req, res) {
    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            });
        }
    });
});

app.post("/login", function (req, res) {
    const user = new User({
        username: req.body.username,
        passport: req.body.password
    });

    req.login(user, function (err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets")
            });
        }
    });
});




app.listen(3000, function () {
    console.log("Server successfuly started on port 3000.");
});