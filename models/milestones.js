// models/milestones.js

let milestones = [
    {
        MilestoneID: 1,
        ParticipantID: 1,
        MilestoneTitle: "Attended First Event",
        MilestoneDate: "2024-03-15"
    },
    {
        MilestoneID: 2,
        ParticipantID: 2,
        MilestoneTitle: "Met Mentor",
        MilestoneDate: "2024-04-01"
    }
];

module.exports = {
    getAll: () => milestones,

    getById: (id) =>
        milestones.find(m => m.MilestoneID === Number(id)),

    create: (data) => {
        const nextID =
            milestones.length > 0
                ? milestones[milestones.length - 1].MilestoneID + 1
                : 1;

        const newMilestone = {
            MilestoneID: nextID,
            ...data
        };

        milestones.push(newMilestone);
        return newMilestone;
    },

    update: (id, updated) => {
        const m = milestones.find(m => m.MilestoneID === Number(id));
        if (!m) return null;
        Object.assign(m, updated);
        return m;
    },

    delete: (id) => {
        milestones = milestones.filter(
            m => m.MilestoneID !== Number(id)
        );
    }
};
