// models/milestones.js
const knex = require("../db");

module.exports = {
    // Get all milestones (Keep this for administrative exports if needed)
    getAll: () => {
        return knex("milestones")
            .join("participants", "milestones.participant_id", "=", "participants.participant_id")
            .select(
                "milestones.*",
                "participants.first_name",
                "participants.last_name"
            )
            .orderBy("milestones.achieved_date", "desc");
    },

    // --- NEW FUNCTION ---
    // Get all milestones for a SPECIFIC participant
    getByParticipant: (participantId) => {
        return knex("milestones")
            .join("participants", "milestones.participant_id", "=", "participants.participant_id")
            .select(
                "milestones.*",
                "participants.first_name",
                "participants.last_name"
            )
            .where({ "milestones.participant_id": participantId })
            .orderBy("milestones.achieved_date", "desc");
    },
    // --------------------

    // Get specific milestone (Needs TWO IDs)
    getById: (participantId, milestoneNo) => {
        return knex("milestones")
            .join("participants", "milestones.participant_id", "=", "participants.participant_id")
            .select(
                "milestones.*",
                "participants.first_name",
                "participants.last_name"
            )
            .where({ 
                "milestones.participant_id": participantId,
                "milestones.milestone_no": milestoneNo 
            })
            .first();
    },

    // Create new milestone (Auto-increments milestone_no per user)
    create: async (data) => {
        const result = await knex("milestones")
            .max("milestone_no as max_no")
            .where({ participant_id: data.participant_id })
            .first();

        const nextNo = (result.max_no || 0) + 1;

        return knex("milestones").insert({
            participant_id: data.participant_id,
            milestone_no: nextNo,
            title: data.title,
            achieved_date: data.achieved_date
        });
    },

    // Update
    update: (participantId, milestoneNo, data) => {
        return knex("milestones")
            .where({ 
                participant_id: participantId,
                milestone_no: milestoneNo 
            })
            .update(data);
    },

    // Delete
    delete: (participantId, milestoneNo) => {
        return knex("milestones")
            .where({ 
                participant_id: participantId,
                milestone_no: milestoneNo 
            })
            .del();
    }
};