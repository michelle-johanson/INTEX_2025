// models/milestones.js
const knex = require("../db");

module.exports = {
    // Get all milestones (Joined with Participant name for display)
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
        // 1. Find the highest milestone number this user currently has
        const result = await knex("milestones")
            .max("milestone_no as max_no")
            .where({ participant_id: data.participant_id })
            .first();

        // 2. Add 1 to it (or start at 1 if they have none)
        const nextNo = (result.max_no || 0) + 1;

        // 3. Insert the new record
        return knex("milestones").insert({
            participant_id: data.participant_id,
            milestone_no: nextNo,
            title: data.title,
            achieved_date: data.achieved_date
        });
    },

    // Update (Needs TWO IDs)
    update: (participantId, milestoneNo, data) => {
        return knex("milestones")
            .where({ 
                participant_id: participantId,
                milestone_no: milestoneNo 
            })
            .update(data);
    },

    // Delete (Needs TWO IDs)
    delete: (participantId, milestoneNo) => {
        return knex("milestones")
            .where({ 
                participant_id: participantId,
                milestone_no: milestoneNo 
            })
            .del();
    }
};