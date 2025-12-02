// models/eventOccurrences.js
const knex = require("../db");

module.exports = {
    // Get all scheduled occurrences AND their parent event name
    getAll: () => {
        return knex("event_occurrences")
            .join("events", "event_occurrences.event_id", "=", "events.event_id")
            .select(
                "event_occurrences.*", // Get all date/time/location info
                "events.name as event_name", // Get the name from parent table
                "events.type as event_type"
            )
            .orderBy("event_occurrences.starts_at", "asc");
    },

    // Get specific occurrence (Joined with Event info)
    getById: (id) => {
        return knex("event_occurrences")
            .join("events", "event_occurrences.event_id", "=", "events.event_id")
            .select(
                "event_occurrences.*",
                "events.name as event_name",
                "events.description as event_description"
            )
            .where({ "event_occurrences.event_occurrence_id": id })
            .first();
    },

    // Create new occurrence
    create: (data) => {
        return knex("event_occurrences").insert(data).returning("event_occurrence_id");
    },

    // Update occurrence
    update: (id, data) => {
        return knex("event_occurrences")
            .where({ event_occurrence_id: id })
            .update(data);
    },

    // Delete occurrence
    delete: (id) => {
        return knex("event_occurrences")
            .where({ event_occurrence_id: id })
            .del();
    }
};