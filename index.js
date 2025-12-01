// Load environment variables from .env file into memory
require("dotenv").config();

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
const multer = require("multer"); // For image uploads
const bodyParser = require("body-parser"); // To read the body of incoming HTTP requests

// Initialize Express App
const app = express();

// View Engine & Static Files
app.set("view engine", "ejs"); // Use EJS for the web pages
app.use(express.static("public"));          // Serves static files from 'public' folder (css)
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded bodies (form submissions)

// Required Middleware
console.log("SESSION_SECRET =", process.env.SESSION_SECRET);

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


const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Website is running!"));