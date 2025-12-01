// Load environment variables from .env file into memory
require("dotenv").config();

/* ============================================================
    INSTALL DEPENDENCIES
============================================================ */

// Core Libraries
const express = require("express");
const session = require("express-session");
const path = require("path");

// Database
const knex = require("knex")({
    client: "pg",
    connection: {
        host: process.env.RDS_HOSTNAME || "localhost",
        user: process.env.RDS_USERNAME || "postgres",
        password: process.env.RDS_PASSWORD || "SuperSecretPassword",
        database: process.env.RDS_DB_NAME || "intex",
        port: process.env.RDS_PORT || 5432,

        ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false
    }
});

// Additional Dependencies
const multer = require("multer");
const bodyParser = require("body-parser");

// Initialize Express App
const app = express();

/* ============================================================
    GLOBAL MIDDLEWARE
============================================================ */

// Parse forms + JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static files (CSS, images, JS)
app.use(express.static(path.join(__dirname, "public")));

// EJS Setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Debug: print SESSION_SECRET
console.log("SESSION_SECRET =", process.env.SESSION_SECRET);

// Sessions
app.use(
    session({
        secret: process.env.SESSION_SECRET || "supersecret",
        resave: false,
        saveUninitialized: false,
    })
);

// Make session available inside EJS views
app.use((req, res, next) => {
    const s = req.session;

    res.locals.session = {
        isLoggedIn: s.isLoggedIn || false,
        userId: s.userId || null,
        username: s.username || null,
        firstname: s.firstname || null,   // from teammate
        access_level: s.access_level || null  // from your version
    };

    next();
});

/* ============================================================
    ROUTES
============================================================ */

// Home
const homeRoutes = require("./routes/home");
app.use("/", homeRoutes);

// Donations (your version — keep)
const donationRoutes = require("./routes/donations");
app.use("/donations", donationRoutes);

// Auth (your version — keep)
const authRoutes = require("./routes/auth");
app.use("/auth", authRoutes);

/* ============================================================
    START SERVER
============================================================ */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
    console.log(`🚀 Website is running! Visit http://localhost:${PORT}`)
);
