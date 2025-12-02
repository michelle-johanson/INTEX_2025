// models/events.js
// Event Templates (NOT occurrences)

let events = [
    {
        EventID: 1,
        EventName: "STEAM Night",
        EventType: "STEAM",
        EventRecurrencePattern: "Monthly",
        EventDescription: "Hands-on STEAM activities",
        EventDefaultCapacity: 50
    },
    {
        EventID: 2,
        EventName: "Mentor Kickoff",
        EventType: "Workshop",
        EventRecurrencePattern: "Once",
        EventDescription: "Meet your mentors",
        EventDefaultCapacity: 30
    }
];

module.exports = {
    getAll: () => events,

    getById: (id) =>
        events.find(e => e.EventID === Number(id)),

    create: (data) => {
        const newEvent = {
            EventID:
                events.length > 0
                    ? events[events.length - 1].EventID + 1
                    : 1,
            ...data
        };
        events.push(newEvent);
        return newEvent;
    },

    update: (id, updated) => {
        const e = events.find(e => e.EventID === Number(id));
        if (!e) return null;
        Object.assign(e, updated);
        return e;
    },

    delete: (id) => {
        events = events.filter(e => e.EventID !== Number(id));
    }
};
