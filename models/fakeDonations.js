// models/fakeDonations.js

// TEMPORARY in-memory donations until real DB (Knex) is ready
let donations = [
    {
        id: 1,
        donor: "Jane Doe",
        amount: 50,
        message: "Love this mission!"
    },
    {
        id: 2,
        donor: "Anonymous",
        amount: 20,
        message: ""
    }
];

// Export functions so the rest of the app doesn't depend on array internals
module.exports = {
    getAll: () => donations,

    getById: (id) => donations.find(d => d.id === Number(id)),

    add: (donor, amount, message) => {
        const newDonation = {
            id: donations.length > 0 ? donations[donations.length - 1].id + 1 : 1,
            donor,
            amount,
            message
        };
        donations.push(newDonation);
        return newDonation;
    },

    update: (id, updatedFields) => {
        const donation = donations.find(d => d.id === Number(id));
        if (!donation) return null;

        Object.assign(donation, updatedFields);
        return donation;
    },

    delete: (id) => {
        donations = donations.filter(d => d.id !== Number(id));
    }
};
