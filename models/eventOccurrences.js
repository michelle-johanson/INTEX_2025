// models/eventOccurrences.js

let eventOccurrences = [
    {
        EventOccurrenceID: 1,
        EventID: 1,
        EventDateTimeStart: "2024-03-15T18:00",
        EventDateTimeEnd: "2024-03-15T20:00",
        EventLocation: "STEM Lab",
        EventCapacity: 40,
        EventRegistrationDeadline: "2024-03-10"
    },
    {
        EventOccurrenceID: 2,
        EventID: 2,
        EventDateTimeStart: "2024-04-10T17:00",
        EventDateTimeEnd: "2024-04-10T19:00",
        EventLocation: "Community Center",
        EventCapacity: 30,
        EventRegistrationDeadline: "2024-04-05"
    }
];

module.exports = {
    getAll: () => eventOccurrences,

    getById: (id) =>
        eventOccurrences.find(o => o.EventOccurrenceID === Number(id)),

    create: (data) => {
        const nextID =
            eventOccurrences.length > 0
                ? eventOccurrences[eventOccurrences.length - 1].EventOccurrenceID + 1
                : 1;

        const newOccurrence = {
            EventOccurrenceID: nextID,
            ...data
        };

        eventOccurrences.push(newOccurrence);
        return newOccurrence;
    },

    update: (id, updated) => {
        const o = eventOccurrences.find(o => o.EventOccurrenceID === Number(id));
        if (!o) return null;
        Object.assign(o, updated);
        return o;
    },

    delete: (id) => {
        eventOccurrences = eventOccurrences.filter(
            o => o.EventOccurrenceID !== Number(id)
        );
    }
};
