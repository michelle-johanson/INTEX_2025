// models/donations.js

let donations = [
    {
        DonationID: 1,
        ParticipantID: 1,
        DonationDate: "2024-02-15",
        DonationAmount: 50
    },
    {
        DonationID: 2,
        ParticipantID: 2,
        DonationDate: "2024-03-01",
        DonationAmount: 20
    }
];

module.exports = {
    getAll: () => donations,

    getById: (id) =>
        donations.find(d => d.DonationID === Number(id)),

    create: (data) => {
        const nextID =
            donations.length > 0
                ? donations[donations.length - 1].DonationID + 1
                : 1;

        const newDonation = {
            DonationID: nextID,
            ...data
        };

        donations.push(newDonation);
        return newDonation;
    },

    update: (id, updated) => {
        const d = donations.find(d => d.DonationID === Number(id));
        if (!d) return null;
        Object.assign(d, updated);
        return d;
    },

    delete: (id) => {
        donations = donations.filter(
            d => d.DonationID !== Number(id)
        );
    }
};
