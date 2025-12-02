// models/surveys.js
const knex = require("../db");

module.exports = {
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
                "events.name as event_name", // Event name comes from the 'events' table
                "event_occurrences.starts_at"
            )
            .orderBy("survey_responses.submission_date", "desc");
    },

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
    }
};