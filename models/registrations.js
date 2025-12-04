// models/registrations.js
const knex = require("../db");

module.exports = {
    // Get all registrations (Triple Join for full details)
    getAll: () => {
        return knex("registrations")
            .join("participants", "registrations.participant_id", "=", "participants.participant_id")
            .join("event_occurrences", "registrations.event_occurrence_id", "=", "event_occurrences.event_occurrence_id")
            .join("events", "event_occurrences.event_id", "=", "events.event_id")
            .select(
                "registrations.*",
                "participants.first_name",
                "participants.last_name",
                "events.name as event_name",
                "event_occurrences.starts_at",
                "event_occurrences.location"
            )
            .orderBy("registrations.created_at", "desc");
    },

    // --- NEW FUNCTION 1: For Participant View ---
    // Get all registrations for a specific USER
    getByParticipant: (participantId) => {
        return knex("registrations")
            .join("participants", "registrations.participant_id", "=", "participants.participant_id")
            .join("event_occurrences", "registrations.event_occurrence_id", "=", "event_occurrences.event_occurrence_id")
            .join("events", "event_occurrences.event_id", "=", "events.event_id")
            .select(
                "registrations.*",
                "participants.first_name",
                "participants.last_name",
                "events.name as event_name",
                "event_occurrences.starts_at",
                "event_occurrences.location"
            )
            .where({ "registrations.participant_id": participantId })
            .orderBy("event_occurrences.starts_at", "desc");
    },

    // --- NEW FUNCTION 2: For Manager View ---
    // Get all registrations for a specific EVENT OCCURRENCE
    getByOccurrence: (occurrenceId) => {
        return knex("registrations")
            .join("participants", "registrations.participant_id", "=", "participants.participant_id")
            .join("event_occurrences", "registrations.event_occurrence_id", "=", "event_occurrences.event_occurrence_id")
            .join("events", "event_occurrences.event_id", "=", "events.event_id")
            .select(
                "registrations.*",
                "participants.first_name",
                "participants.last_name",
                "events.name as event_name",
                "event_occurrences.starts_at",
                "event_occurrences.location"
            )
            .where({ "registrations.event_occurrence_id": occurrenceId })
            .orderBy("participants.last_name", "asc");
    },
    // ----------------------------------------

    // Get specific registration (Needs TWO IDs)
    getByIds: (occurrenceId, participantId) => {
        return knex("registrations")
            .join("participants", "registrations.participant_id", "=", "participants.participant_id")
            .join("event_occurrences", "registrations.event_occurrence_id", "=", "event_occurrences.event_occurrence_id")
            .join("events", "event_occurrences.event_id", "=", "events.event_id")
            .select(
                "registrations.*",
                "participants.first_name",
                "participants.last_name",
                "events.name as event_name",
                "event_occurrences.starts_at",
                "event_occurrences.location"
            )
            .where({
                "registrations.event_occurrence_id": occurrenceId,
                "registrations.participant_id": participantId
            })
            .first();
    },

    // Create
    create: (data) => {
        return knex("registrations").insert(data);
    },

    // Update
    update: (occurrenceId, participantId, data) => {
        return knex("registrations")
            .where({
                event_occurrence_id: occurrenceId,
                participant_id: participantId
            })
            .update(data);
    },

    // Delete
    delete: (occurrenceId, participantId) => {
        return knex("registrations")
            .where({
                event_occurrence_id: occurrenceId,
                participant_id: participantId
            })
            .del();
    },
    
    // --- CASCADING DELETE FUNCTION (FIX) ---
    deleteByOccurrenceId: (occurrenceId) => {
        return knex("registrations")
            .where({ event_occurrence_id: occurrenceId })
            .del();
    }
};