// models/events.js
const knex = require("../db"); // Import the shared connection

module.exports = {
    // Get all events, sorted by ID
    getAll: () => {
        return knex("events").select("*").orderBy("event_id", "asc");
    },

    // Get specific event
    getById: (id) => {
        return knex("events").where({ event_id: id }).first();
    },

    // Create new event
    // We return the IDs to confirm it worked
    create: (data) => {
        return knex("events").insert(data).returning("event_id");
    },

    // Update event
    update: (id, data) => {
        return knex("events")
            .where({ event_id: id })
            .update(data);
    },

    // Delete event
    delete: (id) => {
        return knex("events").where({ event_id: id }).del();
    }
};