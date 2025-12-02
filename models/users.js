// models/users.js
// Make sure this points to where your knex connection is defined!
const knex = require('../db');

module.exports = {
    // 1. Get all participants
    getAll: () => {
        return knex('participants').select('*'); 
    },

    // 2. Find by ID (Mapped to 'participant_id')
    findById: (id) => {
        return knex('participants')
            .where({ participant_id: id })
            .first(); // Returns the object, not an array
    },

    // 3. Find by Email (Since your schema uses email, not username)
    findByEmail: (email) => {
        return knex('participants')
            .where({ email: email })
            .first();
    },

    // 4. Validate Login
    validateCredentials: async (email, password) => {
        const user = await knex('participants')
            .where({ email: email })
            .first();
        
        // In a real app, use bcrypt.compare(password, user.password) here!
        if (user && user.password === password) {
            return user;
        } else {
            return null;
        }
    }
};