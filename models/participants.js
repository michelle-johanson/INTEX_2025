const knex = require("../db");

module.exports = {
    // Get all participants (Now accepts an optional search term)
    getAll: (searchTerm = null) => {
        const query = knex("participants")
            .select("participants.*")
            .sum("donations.amount as total_donations")
            .leftJoin("donations", "participants.participant_id", "donations.participant_id");

        // SEARCH LOGIC:
        // If a search term exists, filter by first_name, last_name, OR email
        if (searchTerm) {
            query.where(builder => {
                builder.where("participants.first_name", "ilike", `%${searchTerm}%`)
                       .orWhere("participants.last_name", "ilike", `%${searchTerm}%`)
                       .orWhere("participants.email", "ilike", `%${searchTerm}%`);
            });
        }

        // Finish the query with grouping and sorting
        return query
            .groupBy("participants.participant_id")
            .orderBy("participants.last_name", "asc");
    },

    // Get specific participant
    getById: (id) => {
        return knex("participants")
            .select("participants.*")
            .sum("donations.amount as total_donations")
            .leftJoin("donations", "participants.participant_id", "donations.participant_id")
            .where({ "participants.participant_id": id })
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