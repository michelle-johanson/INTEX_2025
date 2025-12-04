const knex = require("../db");

module.exports = {
    // Get all Staff Users (Admins only) with search capability
    getAll: (searchTerm = null) => {
        // We select participant_id AS user_id to match the variable name used in the views (m.user_id)
        const query = knex("participants") 
            .where({ 'role': 'admin' }) 
            .select('participant_id as user_id', 'first_name', 'last_name', 'email', 'role'); 

        if (searchTerm) {
            query.where(builder => {
                builder.where('first_name', 'ilike', `%${searchTerm}%`)
                       .orWhere('last_name', 'ilike', `%${searchTerm}%`)
                       .orWhere('email', 'ilike', `%${searchTerm}%`);
            });
        }
        return query.orderBy("participant_id", "asc"); 
    },

    // Get a specific User by ID
    getById: (userId) => {
        // We must select the ID and alias it for the view to work correctly
        return knex("participants")
            .select('*', 'participant_id as user_id') 
            .where({ participant_id: userId })
            .first();
    },

    // Create a new Admin
    create: (data) => {
        return knex("participants").insert(data).returning("*");
    },

    // Update an Admin
    update: (userId, data) => {
        return knex("participants").where({ participant_id: userId }).update(data).returning("*");
    },

    // Delete an Admin
    delete: (userId) => {
        return knex("participants").where({ participant_id: userId }).del();
    }
};