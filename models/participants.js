// models/participants.js
const knex = require("../db");

module.exports = {
    // Get all participants (Includes Total Donations calculation)
    getAll: () => {
        return knex("participants")
            .select("participants.*")
            .sum("donations.amount as total_donations")
            .leftJoin("donations", "participants.participant_id", "donations.participant_id")
            .groupBy("participants.participant_id")
            .orderBy("participants.last_name", "asc");
    },

    // Get specific participant (FIXED: Now includes Total Donations calculation)
    getById: (id) => {
        return knex("participants")
            .select("participants.*")
            .sum("donations.amount as total_donations")
            .leftJoin("donations", "participants.participant_id", "donations.participant_id")
            .where({ "participants.participant_id": id }) // Explicit table name to avoid ambiguity
            .groupBy("participants.participant_id")
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