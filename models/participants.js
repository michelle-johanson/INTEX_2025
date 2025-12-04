const knex = require("../db");

module.exports = {
    // Get all participants (Now supports Full Name search)
    getAll: (searchTerm = null) => {
        const query = knex("participants")
            .select("participants.*")
            .sum("donations.amount as total_donations")
            .leftJoin("donations", "participants.participant_id", "donations.participant_id")
            
            // --- FIX: ADD ROLE FILTER ---
            .where({ 'role': 'participant' }); // Only show actual participants

        // --- SEARCH FILTER ---
        if (searchTerm) {
            query.where(builder => {
                builder.where("participants.first_name", "ilike", `%${searchTerm}%`)
                       .orWhere("participants.last_name", "ilike", `%${searchTerm}%`)
                       .orWhere("participants.email", "ilike", `%${searchTerm}%`)
                       // NEW: Concatenate First + Space + Last to search full name
                       .orWhereRaw("CONCAT(participants.first_name, ' ', participants.last_name) ILIKE ?", [`%${searchTerm}%`]);
            });
        }
        // ---------------------

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

    // Delete participant (FIXED WITH CASCADING TRANSACTION)
    delete: async (id) => {
        // Tables that rely on participant_id via foreign key
        const dependentTables = [
            'donations',
            'registrations', 
            'survey_responses',
            'milestones',
        ];

        // Start a transaction to ensure all deletions are atomic (all succeed or all fail)
        return knex.transaction(async (trx) => {
            
            // 1. Delete records from all dependent tables first
            for (const table of dependentTables) {
                await trx(table)
                    .where({ participant_id: id })
                    .del();
            }

            // 2. Delete the main participant record last
            const result = await trx('participants')
                .where({ participant_id: id })
                .del();

            return result;
        });
    }
};