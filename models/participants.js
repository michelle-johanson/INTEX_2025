// models/participants.js
const knex = require("../db");

module.exports = {
    // Get all participants, alphabetized
    getAll: () => {
        return knex("participants")
            .select("participants.*")
            .sum("donations.amount as total_donations") // Create the column
            .leftJoin("donations", "participants.participant_id", "donations.participant_id")
            .groupBy("participants.participant_id")
            .orderBy("participants.last_name", "asc");
    },

    // Get specific participant
    getById: (id) => {
        return knex("participants")
            .where({ participant_id: id })
            .first();
    },

    // Create new participant
    create: (data) => {
        return knex("participants").insert(data).returning("participant_id");
    },

    // Update participant
    update: (id, data) => {
        return knex("participants")
            .where({ participant_id: id })
            .update(data);
    },

    // Delete participant
    delete: (id) => {
        return knex("participants")
            .where({ participant_id: id })
            .del();
    }
};