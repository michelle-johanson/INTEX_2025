// models/participants.js
// Temporary in-memory fake data for Participants (matches ERD)

let participants = [
    {
        ParticipantID: 1,
        Email: "maria@example.com",
        FirstName: "Maria",
        LastName: "Lopez",
        DOB: "2006-04-12",
        Role: "Student",
        Phone: "555-1234",
        City: "Provo",
        State: "UT",
        Zip: "84604",
        SchoolOrEmployment: "BYU",
        FieldOfInterest: "Engineering",
        TotalDonations: 75
    },
    {
        ParticipantID: 2,
        Email: "sofia@example.com",
        FirstName: "Sofia",
        LastName: "Hernandez",
        DOB: "2007-09-20",
        Role: "Student",
        Phone: "555-5678",
        City: "Orem",
        State: "UT",
        Zip: "84058",
        SchoolOrEmployment: "UVU",
        FieldOfInterest: "Art",
        TotalDonations: 20
    }
];

module.exports = {
    getAll: () => participants,

    getById: (id) =>
        participants.find(p => p.ParticipantID === Number(id)),

    create: (data) => {
        const newParticipant = {
            ParticipantID:
                participants.length > 0
                    ? participants[participants.length - 1].ParticipantID + 1
                    : 1,
            ...data
        };
        participants.push(newParticipant);
        return newParticipant;
    },

    update: (id, updated) => {
        const p = participants.find(p => p.ParticipantID === Number(id));
        if (!p) return null;
        Object.assign(p, updated);
        return p;
    },

    delete: (id) => {
        participants = participants.filter(
            p => p.ParticipantID !== Number(id)
        );
    }
};
