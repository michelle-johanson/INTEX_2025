// models/surveys.js
const knex = require("../db");

module.exports = {
    // --- NEW METHOD: Check if participant has already submitted a survey ---
    checkIfSubmitted: async (occurrenceId, participantId) => {
        // We COUNT the number of records matching the occurrence ID and participant ID
        const result = await knex("survey_responses")
            .where({
                event_occurrence_id: occurrenceId,
                participant_id: participantId
            })
            .count('event_occurrence_id as count')
            .first();

        // If count > 0, the participant has submitted a survey
        return result && result.count > 0;
    },
    // ----------------------------------------------------------------------

    // Get all surveys (Triple Join to get Participant Name AND Event Name)
    getAll: () => {
        return knex("survey_responses")
            .join("participants", "survey_responses.participant_id", "=", "participants.participant_id")
            .join("event_occurrences", "survey_responses.event_occurrence_id", "=", "event_occurrences.event_occurrence_id")
            .join("events", "event_occurrences.event_id", "=", "events.event_id")
            .select(
                "survey_responses.*",
                "participants.first_name",
                "participants.last_name",
                "events.name as event_name", 
                "event_occurrences.starts_at"
            )
            .orderBy("survey_responses.submission_date", "desc");
    },

    // --- NEW FUNCTION 1 ---
    // Get surveys for a specific PARTICIPANT (What the user sees)
    getByParticipant: (participantId) => {
        return knex("survey_responses")
            .join("participants", "survey_responses.participant_id", "=", "participants.participant_id")
            .join("event_occurrences", "survey_responses.event_occurrence_id", "=", "event_occurrences.event_occurrence_id")
            .join("events", "event_occurrences.event_id", "=", "events.event_id")
            .select(
                "survey_responses.*",
                "participants.first_name",
                "participants.last_name",
                "events.name as event_name", 
                "event_occurrences.starts_at"
            )
            .where({ "survey_responses.participant_id": participantId })
            .orderBy("survey_responses.submission_date", "desc");
    },

    // --- UPDATED FUNCTION 2 ---
    // Get surveys for a specific OCCURRENCE (with Search)
    getByOccurrence: (occurrenceId, searchTerm = null) => {
        const query = knex("survey_responses")
            .join("participants", "survey_responses.participant_id", "=", "participants.participant_id")
            .join("event_occurrences", "survey_responses.event_occurrence_id", "=", "event_occurrences.event_occurrence_id")
            .join("events", "event_occurrences.event_id", "=", "events.event_id")
            .select(
                "survey_responses.*",
                "participants.first_name",
                "participants.last_name",
                "events.name as event_name", 
                "event_occurrences.starts_at"
            )
            .where({ "survey_responses.event_occurrence_id": occurrenceId });

        // --- SEARCH FILTER ---
        if (searchTerm) {
            query.where(builder => {
                builder.where("participants.first_name", "ilike", `%${searchTerm}%`)
                       .orWhere("participants.last_name", "ilike", `%${searchTerm}%`)
                       // Search full name "First Last"
                       .orWhereRaw("CONCAT(participants.first_name, ' ', participants.last_name) ILIKE ?", [`%${searchTerm}%`])
                       // Search comments
                       .orWhere("survey_responses.comments", "ilike", `%${searchTerm}%`);
            });
        }

        return query.orderBy("survey_responses.submission_date", "desc");
    },
    // ----------------------

    // Get specific survey (Needs TWO IDs)
    getByIds: (occurrenceId, participantId) => {
        return knex("survey_responses")
            .join("participants", "survey_responses.participant_id", "=", "participants.participant_id")
            .join("event_occurrences", "survey_responses.event_occurrence_id", "=", "event_occurrences.event_occurrence_id")
            .join("events", "event_occurrences.event_id", "=", "events.event_id")
            .select(
                "survey_responses.*",
                "participants.first_name",
                "participants.last_name",
                "events.name as event_name",
                "event_occurrences.starts_at"
            )
            .where({
                "survey_responses.event_occurrence_id": occurrenceId,
                "survey_responses.participant_id": participantId
            })
            .first();
    },

    // Create
    create: (data) => {
        return knex("survey_responses").insert(data);
    },

    // Update
    update: (occurrenceId, participantId, data) => {
        return knex("survey_responses")
            .where({
                event_occurrence_id: occurrenceId,
                participant_id: participantId
            })
            .update(data);
    },

    // Delete
    delete: (occurrenceId, participantId) => {
        return knex("survey_responses")
            .where({
                event_occurrence_id: occurrenceId,
                participant_id: participantId
            })
            .del();
    },
    
    // --- CASCADING DELETE FUNCTION (FIX) ---
    deleteByOccurrenceId: (occurrenceId) => {
        return knex("survey_responses")
            .where({ event_occurrence_id: occurrenceId })
            .del();
    }
};