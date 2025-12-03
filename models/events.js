const knex = require("../db");

// EVENTS MODEL
module.exports = {
    getAll() {
        return knex("events").orderBy("event_id");
    },

    getById(id) {
        return knex("events")
            .where({ event_id: id })
            .first();
    },

    create(data) {
        return knex("events")
            .insert({
                name: data.name,
                description: data.description,
                event_type: data.event_type
            })
            .returning("*");
    },

    update(id, data) {
        return knex("events")
            .where({ event_id: id })
            .update({
                name: data.name,
                description: data.description,
                event_type: data.event_type
            })
            .returning("*");
    },

    delete(id) {
        return knex("events")
            .where({ event_id: id })
            .del();
    },

    // Pull all future occurrences for this event
    getUpcomingOccurrences(id) {
        return knex("event_occurrences")
            .where("event_id", id)
            .andWhere("start_datetime", ">", knex.fn.now())
            .orderBy("start_datetime");
    }
};
