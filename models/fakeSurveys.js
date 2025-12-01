// TEMPORARY in-memory Surveys

let surveys = [
    {
        id: 1,
        participant_id: 1,
        event_id: 1,
        rating: 5,
        comments: "Amazing experience!",
        date_taken: "2024-03-20"
    }
];

module.exports = {
    getAll: () => surveys,

    getById: (id) => surveys.find(s => s.id === Number(id)),

    add: (data) => {
        const newSurvey = {
            id: surveys.length > 0 ? surveys[surveys.length - 1].id + 1 : 1,
            ...data
        };
        surveys.push(newSurvey);
        return newSurvey;
    },

    update: (id, updatedFields) => {
        const survey = surveys.find(s => s.id === Number(id));
        if (!survey) return null;

        Object.assign(survey, updatedFields);
        return survey;
    },

    delete: (id) => {
        surveys = surveys.filter(s => s.id !== Number(id));
    }
};
