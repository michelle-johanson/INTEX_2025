// Load environment variables from .env file into memory
require("dotenv").config();

/* ============================================================
    INSTALL DEPENDENCIES
============================================================ */

// Core Libraries
const express = require("express");
const session = require("express-session");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");

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

// enable layouts
app.use(expressLayouts);
app.set("layout", "layout");

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
        user_id: s.user_id || null,
        username: s.username || null,
        firstname: s.firstname || null,
        access_level: s.access_level || null
    };

    next();
});

/* ============================================================
    ROUTES
============================================================ */

// Home
const homeRoutes = require("./routes/home");
app.use("/", homeRoutes);

// Donations
const donationRoutes = require("./routes/donations");
app.use("/donations", donationRoutes);

// Auth
const authRoutes = require("./routes/auth");
app.use("/auth", authRoutes);

// Participants
const participantRoutes = require("./routes/participants");
app.use("/participants", participantRoutes);

// Events
const eventRoutes = require("./routes/events");
app.use("/events", eventRoutes);

// Surveys
const surveyRoutes = require("./routes/surveys");
app.use("/surveys", surveyRoutes);

// Milestones
const milestoneRoutes = require("./routes/milestones");
app.use("/milestones", milestoneRoutes);


// Teapot 418 Error Code
app.get('/teapot', (req, res) => {
  // This sends the 418 header and a text body
  res.status(418).send("I'm a little teapot, short and stout.");
});
/* ============================================================
    START SERVER
============================================================ */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
    console.log(`🚀 Website is running! Visit http://localhost:${PORT}`)
);
