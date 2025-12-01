// routes/auth.js

const express = require("express");
const router = express.Router();

const Users = require("../models/fakeUsers");  // use model functions

/* ============================================================
    LOGIN FORM
============================================================ */

router.get("/login", (req, res) => {
    res.render("auth/login", {
        title: "Login",
        error: null
    });
});

/* ============================================================
    LOGIN SUBMIT
============================================================ */

router.post("/login", (req, res) => {
    const { username, password } = req.body;

    // validate credentials using the model
    const user = Users.validateCredentials(username, password);

    // incorrect info → send error back to form
    if (!user) {
        return res.render("auth/login", {
            title: "Login",
            error: "Invalid username or password."
        });
    }

    // correct → set session values
    req.session.isLoggedIn = true;
    req.session.userId = user.id;
    req.session.access_level = user.access_level;
    req.session.username = user.username;

    res.redirect("/");
});

/* ============================================================
    LOGOUT
============================================================ */

router.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/auth/login");
    });
});

module.exports = router;
