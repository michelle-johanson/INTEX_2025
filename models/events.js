const knex = require("../db");

// EVENTS MODEL
module.exports = {
    getAll(searchTerm = null) {
        const query = knex("events");

        if (searchTerm) {
            query.where(builder => {
                builder.where("name", "ilike", `%${searchTerm}%`)
                       .orWhere("type", "ilike", `%${searchTerm}%`);
            });
        }

        return query.orderBy("event_id");
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
                type: data.type,
                recurrence_pattern: data.recurrence_pattern,
                default_capacity: data.default_capacity
            })
            .returning("*");
    },

    update(id, data) {
        return knex("events")
            .where({ event_id: id })
            .update({
                name: data.name,
                description: data.description,
                type: data.type,
                recurrence_pattern: data.recurrence_pattern,
                default_capacity: data.default_capacity
            })
            .returning("*");
    },

    // UPDATED: Simple async wrapper for direct deletion (called after cascade)
    delete: async (id) => {
        return knex("events")
            .where({ event_id: id })
            .del();
    }
};