// models/surveys.js

let surveys = [
    {
        EventOccurrenceID: 1,
        ParticipantID: 1,
        SurveySatisfactionScore: 5,
        SurveyUsefulnessScore: 5,
        SurveyRecommendationScore: 5,
        SurveyOverallScore: 5,
        SurveyComments: "Loved it!",
        SurveySubmissionDate: "2024-03-16"
    }
];

module.exports = {
    getAll: () => surveys,

    getByIds: (eventOccurrenceID, participantID) =>
        surveys.find(
            s =>
                s.EventOccurrenceID === Number(eventOccurrenceID) &&
                s.ParticipantID === Number(participantID)
        ),

    create: (data) => {
        surveys.push(data);
        return data;
    },

    update: (eventOccurrenceID, participantID, updated) => {
        const s = surveys.find(
            s =>
                s.EventOccurrenceID === Number(eventOccurrenceID) &&
                s.ParticipantID === Number(participantID)
        );
        if (!s) return null;
        Object.assign(s, updated);
        return s;
    },

    delete: (eventOccurrenceID, participantID) => {
        surveys = surveys.filter(
            s =>
                !(
                    s.EventOccurrenceID === Number(eventOccurrenceID) &&
                    s.ParticipantID === Number(participantID)
                )
        );
    }
};
