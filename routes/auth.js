// routes/auth.js

const express = require("express");
const router = express.Router();

const Users = require("../models/users");
const { render } = require("ejs");

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

    const user = Users.validateCredentials(username, password);

    if (!user) {
        return res.render("auth/login", {
            title: "Login",
            error: "Invalid username or password."
        });
    }

    req.session.isLoggedIn = true;
    req.session.username = user.Username;        // <-- matches model field name
    req.session.access_level = user.AccessLevel; // <-- matches model field name
    req.session.userID = user.UserID;

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
