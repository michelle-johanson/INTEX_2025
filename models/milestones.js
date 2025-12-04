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
    
    // --- NEW FUNCTION: Get list of unique milestone types (Level 1 View) ---
    getUniqueTitles: () => {
        // Uses SELECT DISTINCT to get a list of all unique milestone titles
        return knex("milestones")
            .distinct('title')
            .pluck('title')
            .orderBy('title', 'asc');
    },

    // --- NEW FUNCTION: Get participants who achieved a specific milestone title (Level 2 View) ---
    getParticipantsByTitle: (milestoneTitle) => {
        // Selects participant details based on the milestone title
        return knex("participants")
            .join('milestones', 'participants.participant_id', '=', 'milestones.participant_id')
            .select(
                'participants.participant_id', 
                'participants.first_name', 
                'participants.last_name',
                'participants.email',
                'milestones.achieved_date'
            )
            .where('milestones.title', milestoneTitle)
            .orderBy('milestones.achieved_date', 'desc');
    },
    // ------------------------------------------------------------------------------------------

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