// models/donations.js
const knex = require("../db");

module.exports = {
    // Get all donations (Joined with Participant Name)
    getAll: () => {
        return knex("donations")
            .join("participants", "donations.participant_id", "=", "participants.participant_id")
            .select(
                "donations.*",
                "participants.first_name",
                "participants.last_name"
            )
            .orderBy("donations.donation_date", "desc");
    },

    // Get specific donation (Needs TWO IDs)
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

    // Create new donation (Auto-increment donation_no per user)
    create: async (data) => {
        // 1. Find the highest donation number this user currently has
        const result = await knex("donations")
            .max("donation_no as max_no")
            .where({ participant_id: data.participant_id })
            .first();

        // 2. Add 1 (or start at 1)
        const nextNo = (result.max_no || 0) + 1;

        // 3. Insert
        return knex("donations").insert({
            participant_id: data.participant_id,
            donation_no: nextNo,
            donation_date: data.donation_date,
            amount: data.amount
        });
    },

    // Update (Needs TWO IDs)
    update: (participantId, donationNo, data) => {
        return knex("donations")
            .where({ 
                participant_id: participantId, 
                donation_no: donationNo 
            })
            .update(data);
    },

    // Delete (Needs TWO IDs)
    delete: (participantId, donationNo) => {
        return knex("donations")
            .where({ 
                participant_id: participantId, 
                donation_no: donationNo 
            })
            .del();
    }
};