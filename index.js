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
    MIDDLEWARE
============================================================ */

// Middleware
app.use(express.urlencoded({ extended: true }));            // Parses URL-encoded bodies (form submissions)
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));    // Serves static files from 'public' folder (css)

// Set view engine
app.set("view engine", "ejs");                      // Use EJS for the web pages
app.set("views", path.join(__dirname, "views"));

// Required Middleware
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
