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

        // 3. Update Session Data to match your new Database Schema
        req.session.isLoggedIn = true;
        
        // Schema: 'email', Model: 'email'
        req.session.username = user.email; 
        
        // Schema: 'role', Model: 'role' (Mapped from AccessLevel)
        req.session.access_level = user.role || 'guest'; 
        
        // Schema: 'participant_id'
        req.session.userID = user.participant_id; 

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
