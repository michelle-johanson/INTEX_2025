// TEMPORARY in-memory milestones

let milestones = [
    {
        id: 1,
        title: "Attend first event",
        description: "Participant attends their first Ella Rises event",
        participant_id: 1,
        completed: false
    },
    {
        id: 2,
        title: "Meet your mentor",
        description: "First mentor meeting completed",
        participant_id: 2,
        completed: true
    }
];

module.exports = {
    getAll: () => milestones,

    getById: (id) => milestones.find(m => m.id === Number(id)),

    add: (data) => {
        const newMilestone = {
            id: milestones.length > 0 ? milestones[milestones.length - 1].id + 1 : 1,
            ...data
        };
        milestones.push(newMilestone);
        return newMilestone;
    },

    update: (id, updatedFields) => {
        const milestone = milestones.find(m => m.id === Number(id));
        if (!milestone) return null;

        Object.assign(milestone, updatedFields);
        return milestone;
    },

    delete: (id) => {
        milestones = milestones.filter(m => m.id !== Number(id));
    }
};
