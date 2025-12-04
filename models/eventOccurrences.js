const knex = require("../db");

// --- UTILITY FUNCTION FOR CASCADE DELETE ---
// This function handles the atomic deletion of all downstream dependencies 
// for a single event occurrence ID. It uses the transaction object (trx) for atomicity.
async function cascadeDeleteOccurrence(occurrenceId, trx) {
    // Tables dependent on event_occurrence_id
    const dependentTables = [
        'registrations', 
        'survey_responses'
    ];

    // 1. Delete records from all dependent tables
    for (const table of dependentTables) {
        // Use trx() to ensure the query is part of the transaction
        await trx(table) 
            .where({ event_occurrence_id: occurrenceId })
            .del();
    }
    
    // 2. Delete the main occurrence record
    await trx('event_occurrences')
        .where({ event_occurrence_id: occurrenceId })
        .del();
}
// ------------------------------------------

module.exports = {
    // Standard getAll for the main list (Level 2)
    getAll(searchTerm = null) {
        const query = knex("event_occurrences")
            .join("events", "event_occurrences.event_id", "events.event_id")
            .select(
                "event_occurrences.*",
                "events.name as event_name",
                "events.type as event_type"
            );

        if (searchTerm) {
            query.where(builder => {
                builder.where("events.name", "ilike", `%${searchTerm}%`)
                       .orWhere("events.type", "ilike", `%${searchTerm}%`)
                       .orWhere("event_occurrences.location", "ilike", `%${searchTerm}%`);
            });
        }

        return query.orderBy("event_occurrences.starts_at", "asc");
    },

    getUpcoming() {
        return knex("event_occurrences")
            .join("events", "event_occurrences.event_id", "events.event_id")
            .select(
                "event_occurrences.*",
                "events.name as event_name",
                "events.type as event_type"
            )
            .where("event_occurrences.starts_at", ">", knex.fn.now())
            .orderBy("event_occurrences.starts_at", "asc");
    },

    getById(id) {
        return knex("event_occurrences")
            .join("events", "event_occurrences.event_id", "events.event_id")
            .select(
                "event_occurrences.*",
                "events.name as event_name",
                "events.description as event_description",
                "events.type as event_type"
            )
            .where({ event_occurrence_id: id })
            .first();
    },

    getByEventId(eventId, searchTerm = null) {
        const query = knex("event_occurrences")
            .join("events", "event_occurrences.event_id", "events.event_id")
            .select(
                "event_occurrences.*",
                "events.name as event_name",
                "events.type as event_type"
            )
            .where("event_occurrences.event_id", eventId);

        if (searchTerm) {
            query.andWhere(builder => {
                builder.where("event_occurrences.location", "ilike", `%${searchTerm}%`);
            });
        }

        return query.orderBy("event_occurrences.starts_at", "asc");
    },
    // -----------------------------------------

    create(data) {
        return knex("event_occurrences")
            .insert({
                event_id: data.event_id,
                starts_at: data.starts_at,
                ends_at: data.ends_at,
                location: data.location,
                capacity: data.capacity,
                registration_deadline: data.registration_deadline
            })
            .returning("event_occurrence_id");
    },

    update(id, data) {
        return knex("event_occurrences")
            .where({ event_occurrence_id: id })
            .update({
                event_id: data.event_id,
                starts_at: data.starts_at,
                ends_at: data.ends_at,
                location: data.location,
                capacity: data.capacity,
                registration_deadline: data.registration_deadline
            });
    },

    // 1. New function called by routes/events.js to delete all occurrences of a parent event
    deleteByEventId: async (eventId) => {
        // Find all occurrence IDs linked to this event
        const occurrenceIds = await knex('event_occurrences')
            .where({ event_id: eventId })
            .select('event_occurrence_id');

        // Start a single transaction to manage all cascades for all children
        return knex.transaction(async (trx) => {
            for (const row of occurrenceIds) {
                // Use the utility function to delete registrations/surveys and the occurrence
                await cascadeDeleteOccurrence(row.event_occurrence_id, trx);
            }
        });
    },

    // 2. Standard delete function (UPDATED to use cascade logic)
    delete: async (id) => {
        // Start a transaction to manage the atomic cascade for this single ID
        return knex.transaction(async (trx) => {
            await cascadeDeleteOccurrence(id, trx);
        });
    }
};