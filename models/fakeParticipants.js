// TEMPORARY in-memory participant records

let participants = [
    {
        id: 1,
        first_name: "Maria",
        last_name: "Lopez",
        email: "maria@example.com",
        phone: "555-1234",
        program: "Mariachi"
    },
    {
        id: 2,
        first_name: "Sofia",
        last_name: "Hernandez",
        email: "sofia@example.com",
        phone: "555-5678",
        program: "STEAM"
    }
];

module.exports = {
    getAll: () => participants,

    getById: (id) => participants.find(p => p.id === Number(id)),

    add: (data) => {
        const newParticipant = {
            id: participants.length > 0 ? participants[participants.length - 1].id + 1 : 1,
            ...data
        };
        
        participants.push(newParticipant);
        return newParticipant;
    },

    update: (id, updatedFields) => {
        const participant = participants.find(p => p.id === Number(id));
        if (!participant) return null;

        Object.assign(participant, updatedFields);
        return participant;
    },

    delete: (id) => {
        participants = participants.filter(p => p.id !== Number(id));
    }
};
