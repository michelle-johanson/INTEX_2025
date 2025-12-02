// routes/auth.js

const express = require("express");
const router = express.Router();

const Users = require("../models/users");

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
    // FIXED → expecting lowercase fields from your form
    const { username, password } = req.body;

    const user = Users.validateCredentials(username, password);

    if (!user) {
        return res.render("auth/login", {
            title: "Login",
            error: "Invalid username or password."
        });
    }

    // session values
    req.session.isLoggedIn = true;
    req.session.UserID = user.UserID;
    req.session.Username = user.Username;
    req.session.AccessLevel = user.AccessLevel;

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
