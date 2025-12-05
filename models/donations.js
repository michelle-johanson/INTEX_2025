const knex = require("../db");

module.exports = {
    // UPDATED: Now supports "First Last" name search
    getAll: (searchTerm = null) => {
        const query = knex("donations")
            .join("participants", "donations.participant_id", "=", "participants.participant_id")
            .select(
                "donations.*",
                "participants.first_name",
                "participants.last_name"
            );

        // --- SEARCH FILTER ---
        if (searchTerm) {
            query.where(builder => {
                builder.where("participants.first_name", "ilike", `%${searchTerm}%`)
                        .orWhere("participants.last_name", "ilike", `%${searchTerm}%`)
                        // NEW: Concatenate First + Space + Last to search full name
                        .orWhereRaw("CONCAT(participants.first_name, ' ', participants.last_name) ILIKE ?", [`%${searchTerm}%`]);
            });
        }
        // ---------------------

        // FIX: Sort by date descending (Newest first), but force NULLs to the bottom
        return query.orderByRaw("donations.donation_date DESC NULLS LAST");
    },

    // Get specific donation
    getById: (participantId, donationNo) => {
        return knex("donations")
            .join("participants", "donations.participant_id", "=", "participants.participant_id")
            .select(
                "donations.*",
                "participants.first_name",
                "participants.last_name",
                "participants.email"
            )
            .where({ 
                "donations.participant_id": participantId, 
                "donations.donation_no": donationNo
            })
            .first();
    },

    // Create new donation
    create: async (data) => {
        const result = await knex("donations")
            .max("donation_no as max_no")
            .where({ participant_id: data.participant_id })
            .first();

        const nextNo = (result.max_no || 0) + 1;

        return knex("donations").insert({
            participant_id: data.participant_id,
            donation_no: nextNo,
            donation_date: data.donation_date,
            amount: data.amount
        });
    },

    // Update
    update: (participantId, donationNo, data) => {
        return knex("donations")
            .where({ 
                participant_id: participantId, 
                donation_no: donationNo 
            })
            .update(data);
    },

    // Delete
    delete: (participantId, donationNo) => {
        return knex("donations")
            .where({ 
                participant_id: participantId, 
                donation_no: donationNo 
            })
            .del();
    }
};