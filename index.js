// Load environment variables
require("dotenv").config();

// Core Libraries
const express = require("express");
const session = require("express-session");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");

// Initialize Express App
const app = express();

/* ============================================================
   GLOBAL MIDDLEWARE
============================================================ */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// EJS Setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layout");

// Sessions
app.use(session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
}));

// Session Locals & Flash Messages
app.use((req, res, next) => {
    const s = req.session;
    
    // 1. GLOBAL VARIABLES (Accessible in all EJS files)
    res.locals.session = {
        isLoggedIn: s.isLoggedIn || false,
        user_id: s.user_id || s.userID || null,
        username: s.username || null,
        firstname: s.firstname || null,
        lastname: s.lastname || null,
        access_level: s.access_level || null
    };

    // 2. FLASH MESSAGE LOGIC
    // Check if there's a message in the session
    const message = s.message;
    
    // Pass it to the view
    res.locals.message = message || null;
    
    // CLEAR IT from the session so it doesn't show up again
    delete s.message;
    
    next();
});

/* ============================================================
   ROUTES (The "Switchboard")
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

// Event Occurrences
const eventOccurrenceRoutes = require("./routes/eventOccurrences");
app.use("/eventOccurrences", eventOccurrenceRoutes);

// Registrations
const registrationsRoutes = require("./routes/registrations");
app.use("/registrations", registrationsRoutes);

// Surveys
const surveyRoutes = require("./routes/surveys");
app.use("/surveys", surveyRoutes);

// Milestones
const milestoneRoutes = require("./routes/milestones");
app.use("/milestones", milestoneRoutes);

// Dashboard
const dashboardRoutes = require("./routes/dashboard");
app.use("/dashboard", dashboardRoutes);

// Manage Users
const usersRoutes = require('./routes/users'); 
app.use('/users', usersRoutes);

// Manage Staff
const staffRouter = require('./routes/staff');
app.use('/staff', staffRouter);

/* ============================================================
   OTHER REQUIRED ROUTES
============================================================ */

// Teapot (IS 404 requirement)
app.get("/teapot", (req, res) => {
    res.status(418).send("I'm a little teapot, short and stout.");
});

/* ============================================================
   START SERVER
============================================================ */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
    console.log(`🚀 Website is running! Visit http://localhost:${PORT}`)
);