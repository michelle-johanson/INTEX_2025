// models/registrations.js

let registrations = [
    {
        EventOccurrenceID: 1,
        ParticipantID: 1,
        RegistrationStatus: "Registered",
        RegistrationAttendedFlag: false,
        RegistrationCheckInTime: null,
        RegistrationCreatedAt: "2024-02-28"
    }
];

module.exports = {
    getAll: () => registrations,

    getByIds: (eventOccurrenceID, participantID) =>
        registrations.find(
            r =>
                r.EventOccurrenceID === Number(eventOccurrenceID) &&
                r.ParticipantID === Number(participantID)
        ),

    create: (data) => {
        registrations.push(data);
        return data;
    },

    update: (eventOccurrenceID, participantID, updated) => {
        const r = registrations.find(
            r =>
                r.EventOccurrenceID === Number(eventOccurrenceID) &&
                r.ParticipantID === Number(participantID)
        );
        if (!r) return null;
        Object.assign(r, updated);
        return r;
    },

    delete: (eventOccurrenceID, participantID) => {
        registrations = registrations.filter(
            r =>
                !(
                    r.EventOccurrenceID === Number(eventOccurrenceID) &&
                    r.ParticipantID === Number(participantID)
                )
        );
    }
};
