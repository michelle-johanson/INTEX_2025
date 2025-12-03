const knex = require("../db");

module.exports = {
    getAll() {
        return knex("event_occurrences")
            .join("events", "event_occurrences.event_id", "events.event_id")
            .select(
                "event_occurrences.*",
                "events.name as event_name",
                "events.type as event_type"
            )
            .orderBy("event_occurrences.starts_at", "asc");
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

    getByEventId(eventId) {
        return knex("event_occurrences")
            .join("events", "event_occurrences.event_id", "events.event_id")
            .select(
                "event_occurrences.*",
                "events.name as event_name",
                "events.type as event_type"
            )
            .where("event_occurrences.event_id", eventId)
            .orderBy("event_occurrences.starts_at", "asc");
    },

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

    delete(id) {
        return knex("event_occurrences")
            .where({ event_occurrence_id: id })
            .del();
    }
};
