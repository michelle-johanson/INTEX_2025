// db.js
const knex = require("knex");
const config = require("./knexfile");

// This decides: "Are we on AWS (production) or my laptop (development)?"
const environment = process.env.NODE_ENV || "development";

// Create the connection using the correct settings from knexfile.js
const db = knex(config[environment]);

module.exports = db;