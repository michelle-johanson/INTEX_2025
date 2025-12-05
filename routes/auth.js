const express = require("express");
const router = express.Router();

const Users = require("../models/users");
const Participants = require("../models/participants");

/* ============================================================
   GET /auth/login — Login Form
============================================================ */
router.get("/login", (req, res) => {
    const error = req.session.loginError || null;
    delete req.session.loginError;

    res.render("auth/login", {
        title: "Login",
        error,
        hideFooter: true
    });
});

/* ============================================================
   POST /auth/login — Process Login
============================================================ */
router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await Users.validateCredentials(username, password);

        if (!user) {
            req.session.loginError = "Invalid email or password.";
            return res.redirect("/auth/login");
        }

        // Session setup
        req.session.user_id = user.participant_id;
        req.session.user = user;

        req.session.isLoggedIn = true;
        req.session.username = user.email;
        req.session.firstname = user.first_name;
        req.session.lastname = user.last_name;
        req.session.access_level = user.role;

        /* --- 1. PENDING DONATION (highest priority) --- */
        if (req.session.pendingDonation) {
            return req.session.save(() => res.redirect("/donations/new"));
        }

        /* --- 2. RETURN TO PREVIOUS PAGE --- */
        const redirectTo = req.session.returnTo || "/";
        delete req.session.returnTo;

        /* --- 3. DEFAULT REDIRECT --- */
        return res.redirect(redirectTo);

    } catch (err) {
        console.error(err);
        req.session.loginError = "An internal error occurred during login.";
        return res.redirect("/auth/login");
    }
});

/* ============================================================
   GET /auth/signup — Signup Form
============================================================ */
router.get("/signup", (req, res) => {
    const errors = req.session.errors || {};
    const formData = req.session.formData || {};

    delete req.session.errors;
    delete req.session.formData;

    res.render("auth/signup", {
        title: "Sign Up",
        errors,
        formData
    });
});

/* ============================================================
   POST /auth/signup — Create Account
============================================================ */
router.post("/signup", async (req, res) => {
    const {
        email, first_name, last_name, dob, phone, city, state, zip,
        school_or_employer, field_of_interest, password, confirm_password
    } = req.body;

    const errors = {};

    if (!first_name) errors.first_name = "First name is required.";
    if (!last_name) errors.last_name = "Last name is required.";
    if (password.length < 6) errors.password = "Password must be at least 6 characters.";
    if (password !== confirm_password) errors.confirm_password = "Passwords do not match.";

    try {
        const existingUser = await Participants.findByEmail(email);
        if (existingUser) errors.email = "This email is already registered.";
    } catch (err) {
        console.error("Signup check error:", err);
        errors.general = "A server error occurred during validation.";
    }

    if (Object.keys(errors).length > 0) {
        req.session.errors = errors;
        req.session.formData = req.body;
        return res.redirect("/auth/signup");
    }

    try {
        const newUser = {
            email,
            first_name,
            last_name,
            dob: dob || null,
            phone: phone || null,
            city: city || null,
            state: state || null,
            zip: zip || null,
            school_or_employer: school_or_employer || null,
            field_of_interest: field_of_interest || null,
            password,
            role: "participant"
        };

        const created = await Participants.create(newUser);
        const user = created[0] || created;

        // Session setup
        req.session.user_id = user.participant_id;
        req.session.user = user;

        req.session.isLoggedIn = true;
        req.session.username = user.email;
        req.session.firstname = user.first_name;
        req.session.lastname = user.last_name;
        req.session.access_level = user.role;

        /* --- 1. PENDING DONATION PRIORITY --- */
        if (req.session.pendingDonation) {
            return req.session.save(() => res.redirect("/donations/new"));
        }

        /* --- 2. RETURN TO PREVIOUS PAGE --- */
        const redirectTo = req.session.returnTo || "/";
        delete req.session.returnTo;

        /* --- 3. DEFAULT --- */
        return res.redirect(redirectTo);

    } catch (err) {
        console.error("Signup creation error:", err);
        req.session.errors = { general: "Internal error creating account." };
        req.session.formData = req.body;
        return res.redirect("/auth/signup");
    }
});

/* ============================================================
   GET /auth/logout — Destroy Session
============================================================ */
router.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/auth/login");
    });
});

module.exports = router;
