// TEMPORARY in-memory fake events

let events = [
    {
        id: 1,
        name: "Mentor Kickoff",
        date: "2024-03-15",
        location: "Community Center",
        event_type: "Workshop"
    },
    {
        id: 2,
        name: "STEAM Night",
        date: "2024-04-10",
        location: "STEM Lab",
        event_type: "STEAM"
    }
];

module.exports = {
    getAll: () => events,

    getById: (id) => events.find(e => e.id === Number(id)),

    add: (data) => {
        const newEvent = {
            id: events.length > 0 ? events[events.length - 1].id + 1 : 1,
            ...data
        };
        events.push(newEvent);
        return newEvent;
    },

    update: (id, updatedFields) => {
        const event = events.find(e => e.id === Number(id));
        if (!event) return null;

        Object.assign(event, updatedFields);
        return event;
    },

    delete: (id) => {
        events = events.filter(e => e.id !== Number(id));
    }
};
