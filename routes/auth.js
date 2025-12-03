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
// 1. Notice the 'async' keyword here
router.post("/login", async (req, res) => {
    
    // Assuming your form input name is "username", but we treat it as email based on your schema
    const { username, password } = req.body; 

    try {
        // 2. We use 'await' because the database takes time to search
        const user = await Users.validateCredentials(username, password);

        if (!user) {
            return res.render("auth/login", {
                title: "Login",
                error: "Invalid email or password."
            });
        }

        // I didn't want to mess anything up but we should standardize later
        req.session.userID = user.participant_id; 
        req.session.user_id = user.participant_id; 

        req.session.isLoggedIn = true;
        req.session.username = user.email;
        req.session.firstname = user.first_name;
        req.session.lastname = user.last_name;
        req.session.access_level = user.role;

        res.redirect("/");

    } catch (err) {
        console.error(err);
        res.render("auth/login", {
            title: "Login",
            error: "An error occurred during login."
        });
    }
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
