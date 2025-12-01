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
        host : process.env.DB_HOST || "localhost",
        user : process.env.DB_USER || "postgres",
        password : process.env.DB_PASSWORD || "admin",
        database : process.env.DB_NAME || "intex",
        port : process.env.DB_PORT || 5434
    }
});

// Additional Dependancies
const multer = require("multer");           // For image uploads
const bodyParser = require("body-parser");  // To read the body of incoming HTTP requests

// Initialize Express App
const app = express();

/* ============================================================
    MIDDLEWARE
============================================================ */

// Middleware
app.use(express.urlencoded({ extended: true }));            // Parses URL-encoded bodies (form submissions)
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));    // Serves static files from 'public' folder (css)

// Set view engine
app.set("view engine", "ejs");                      // Use EJS for the web pages
app.set("views", path.join(__dirname, "views"));

// Session Variables
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
    })
);

// Middleware to make session data available in all views
app.use((req, res, next) => {
    const s = req.session;

    res.locals.session = {
        isLoggedIn: s.isLoggedIn || false,
        userId: s.userId || null,
        username: s.username || null,
        firstname: s.firstname || null
    };

    next();
});

/* ============================================================
    ROUTES
============================================================ */

const homeRoutes = require("./routes/home");
app.use("/", homeRoutes);

/* ============================================================
    START SERVER
============================================================ */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Website is running! Check port ${PORT}`));
