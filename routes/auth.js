// routes/auth.js

const express = require("express");
const router = express.Router();

const Users = require("../models/users");
const Participants = require("../models/participants"); // Assuming Participants model handles creation
const { render } = require("ejs");

/* ============================================================
   LOGIN FORM
============================================================ */
router.get("/login", (req, res) => {
    // Retrieve and clear flash data (if any)
    const error = req.session.loginError;
    delete req.session.loginError;
    
    res.render("auth/login", {
        title: "Login",
        error: error || null
    });
});


/* ============================================================
   LOGIN SUBMIT
============================================================ */
router.post("/login", async (req, res) => {
    
    const { username, password } = req.body; 

    try {
        const user = await Users.validateCredentials(username, password);

        if (!user) {
            req.session.loginError = "Invalid email or password.";
            return res.redirect("/auth/login"); // Redirect instead of render for cleaner UX
        }

        // Setting session data
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
        req.session.loginError = "An internal error occurred during login.";
        res.redirect("/auth/login");
    }
});

/* ============================================================
   SIGNUP FORM (GET)
============================================================ */
router.get("/signup", (req, res) => {
    // Retrieve and clear flash data (errors and previous form data)
    const sessionErrors = req.session.errors;
    delete req.session.errors;
    const sessionFormData = req.session.formData;
    delete req.session.formData;

    res.render("auth/signup", {
        title: "Sign Up",
        errors: sessionErrors || {},
        formData: sessionFormData || {}
    });
});

/* ============================================================
   SIGNUP SUBMIT (POST)
============================================================ */
router.post("/signup", async (req, res) => {
    const { email, first_name, last_name, password, confirm_password } = req.body;
    const errors = {};

    // 1. Password Validation
    if (password.length < 6) errors.password = "Password must be at least 6 characters long.";
    if (password !== confirm_password) errors.confirm_password = "Passwords do not match.";

    // 2. Email Existence Check (Assuming Participants model can check email existence)
    try {
        const existingUser = await Participants.findByEmail(email); 
        if (existingUser) {
            errors.email = "This email is already registered.";
        }
    } catch (dbErr) {
        console.error("Signup DB Check Error:", dbErr);
        errors.general = "A server error occurred during validation.";
    }

    // 3. Handle Validation Failure
    if (Object.keys(errors).length > 0) {
        req.session.errors = errors;
        req.session.formData = req.body;
        return res.redirect("/auth/signup");
    }

    // 4. Create New Participant (Success)
    try {
        const newParticipant = {
            email: email,
            first_name: first_name,
            last_name: last_name,
            password: password, // WARNING: Saved as plain text
            role: 'participant' // Hardcoded default role
        };

        const result = await Participants.create(newParticipant);

        // Optional: Automatically log the user in after successful creation
        const user = result[0] || result; 

        req.session.userID = user.participant_id; 
        req.session.user_id = user.participant_id; 
        req.session.isLoggedIn = true;
        req.session.username = user.email;
        req.session.firstname = user.first_name;
        req.session.lastname = user.last_name;
        req.session.access_level = user.role;

        // FIX: Redirect to the root path (/) which is handled by routes/home.js
        return res.redirect("/"); 
        
    } catch (err) {
        console.error("Signup Creation Error:", err);
        req.session.errors = { general: "Failed to create account due to an internal error." };
        req.session.formData = req.body;
        return res.redirect("/auth/signup");
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