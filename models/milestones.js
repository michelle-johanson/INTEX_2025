const knex = require("../db");

module.exports = {
    // Get all milestones
    getAll: () => {
        return knex("milestones")
            .leftJoin("participants", "milestones.participant_id", "=", "participants.participant_id")
            .select(
                "milestones.*",
                "participants.first_name",
                "participants.last_name"
            )
            .orderBy("milestones.achieved_date", "desc");
    },
    
    // --- UPDATED FUNCTION: Get list of unique milestone types with SEARCH ---
    getUniqueTitles: (searchTerm = null) => {
        const query = knex("milestones");

        // Add search filter if provided
        if (searchTerm) {
            query.where('title', 'ilike', `%${searchTerm}%`);
        }

        return query
            .distinct('title')
            .pluck('title')
            .orderBy('title', 'asc');
    },

    // Get participants who achieved a specific milestone title
    getParticipantsByTitle: (milestoneTitle) => {
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

    // Get all milestones for a SPECIFIC participant
    getByParticipant: (participantId) => {
        return knex("milestones")
            .leftJoin("participants", "milestones.participant_id", "=", "participants.participant_id")
            .select(
                "milestones.*",
                "participants.first_name",
                "participants.last_name"
            )
            .where({ "milestones.participant_id": participantId })
            .orderBy("milestones.achieved_date", "desc");
    },

    // Get specific milestone
    getById: (participantId, milestoneNo) => {
        return knex("milestones")
            .leftJoin("participants", "milestones.participant_id", "=", "participants.participant_id")
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

    update: (participantId, milestoneNo, data) => {
        return knex("milestones")
            .where({ 
                participant_id: participantId,
                milestone_no: milestoneNo 
            })
            .update(data);
    },

    delete: (participantId, milestoneNo) => {
        return knex("milestones")
            .where({ 
                participant_id: participantId,
                milestone_no: milestoneNo 
            })
            .del();
    },

    updateByTitle: (oldTitle, newTitle) => {
        return knex('milestones')
            .where({ title: oldTitle })
            .update({ title: newTitle });
    },

    deleteByTitle: (titleToDelete) => {
        return knex('milestones')
            .where({ title: titleToDelete })
            .del();
    }
};