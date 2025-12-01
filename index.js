// Load environment variables from .env file into memory
require("dotenv").config();

/* ============================================================
    INSTALL DEPENDANCIES
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

        ssl: process.env.DB_SSL ? {rejectUnauthorized: false} : false 

    }
});

// Additional Dependancies
const multer = require("multer");           // For image uploads
const bodyParser = require("body-parser");  // To read the body of incoming HTTP requests

// Initialize Express App
const app = express();

/* ============================================================
    GLOBAL MIDDLEWARE
============================================================ */

// Body parsing (forms + JSON)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static files (CSS, images, JS)
app.use(express.static(path.join(__dirname, "public")));

// EJS Setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

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
        access_level: s.access_level || null
    };

    next();
});


/* ============================================================
    ROUTES
============================================================ */

// Home (landing page)
const homeRoutes = require("./routes/home");
app.use("/", homeRoutes);

// Donations (public + admin CRUD)
const donationRoutes = require("./routes/donations");
app.use("/donations", donationRoutes);

// Auth (login/logout)
const authRoutes = require("./routes/auth");
app.use("/auth", authRoutes);

/* ============================================================
    START SERVER
============================================================ */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Website is running! Visit http://localhost:${PORT}`);
});