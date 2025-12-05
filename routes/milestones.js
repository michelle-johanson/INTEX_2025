const express = require("express");
const router = express.Router();

const { requireAdmin, requireLogin } = require("../middleware/auth");
const Milestones = require("../models/milestones");
const Participants = require("../models/participants");

/* GET /milestones — manager: milestone types | participant: own milestones */
router.get("/", requireLogin, async (req, res) => {
    try {
        const role = (req.session.access_level || "").toLowerCase();

        // Manager/Admin: list milestone types
        if (role === "manager" || role === "admin") {
            const milestoneTypes = await Milestones.getUniqueTitles();
            return res.render("milestones/types_index", {
                title: "Milestone Achievements Directory",
                milestoneTypes
            });
        }

        // Participant: list own milestones
        const myId = Number(req.session.user_id);
        if (!myId) return res.redirect("/auth/login");

        const myMilestones = await Milestones.getByParticipant(myId);

        res.render("milestones/index", {
            title: "My Milestones",
            milestones: myMilestones,
            participantName: "My"
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Database Error");
    }
});

/* GET /milestones/type/:title — view participants with this milestone type (admin) */
router.get("/type/:title", requireAdmin, async (req, res) => {
    try {
        const milestoneTitle = req.params.title;
        const participants = await Milestones.getParticipantsByTitle(milestoneTitle);

        res.render("milestones/participants_by_type", {
            title: `Participants with: ${milestoneTitle}`,
            participants,
            milestoneTitle
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading participants by milestone type");
    }
});

/* GET /milestones/type/:title/edit — rename milestone type (admin) */
router.get("/type/:title/edit", requireAdmin, async (req, res) => {
    try {
        const oldTitle = req.params.title;

        res.render("milestones/type_edit", {
            title: "Rename Milestone Type",
            oldTitle,
            session: req.session
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading edit form");
    }
});

/* POST /milestones/type/:title/edit — update milestone type (admin) */
router.post("/type/:title/edit", requireAdmin, async (req, res) => {
    try {
        const oldTitle = req.params.title;
        const newTitle = req.body.MilestoneTitle;

        await Milestones.updateByTitle(oldTitle, newTitle);
        res.redirect(`/milestones/type/${encodeURIComponent(newTitle)}`);

    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating milestone type");
    }
});

/* POST /milestones/type/:title/delete — delete milestone type (admin) */
router.post("/type/:title/delete", requireAdmin, async (req, res) => {
    try {
        const titleToDelete = req.params.title;
        await Milestones.deleteByTitle(titleToDelete);

        res.redirect("/milestones");

    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting milestone type");
    }
});

/* GET /milestones/participant/:id — participant or manager view of milestones */
router.get("/participant/:id", requireLogin, async (req, res) => {
    try {
        const participantId = Number(req.params.id);
        const loggedInUserId = Number(req.session.user_id);
        const role = (req.session.access_level || "").toLowerCase();

        const isManager = role === "manager" || role === "admin";
        const isOwner = loggedInUserId === participantId;

        if (!isManager && !isOwner) {
            return res.status(403).send("Unauthorized Access");
        }

        const milestones = await Milestones.getByParticipant(participantId);
        const participant = await Participants.getById(participantId);

        if (!participant) return res.status(404).send("Participant not found");

        res.render("milestones/index", {
            title: `${participant.first_name}'s Milestones`,
            milestones,
            participantName: `${participant.first_name}'s`,
            participant
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading participant milestones");
    }
});

/* GET /milestones/new — admin milestone creation form */
router.get("/new", requireAdmin, async (req, res) => {
    try {
        const participants = await Participants.getAll();
        const selectedId = req.query.participant_id;

        res.render("milestones/new", {
            title: "Add Milestone",
            participants,
            selectedId
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading form");
    }
});

/* POST /milestones/new — create milestone (admin) */
router.post("/new", requireAdmin, async (req, res) => {
    try {
        const newMilestone = {
            participant_id: Number(req.body.ParticipantID),
            title: req.body.MilestoneTitle,
            achieved_date: req.body.MilestoneDate
        };

        await Milestones.create(newMilestone);
        res.redirect(`/milestones/participant/${newMilestone.participant_id}`);

    } catch (err) {
        console.error(err);
        res.status(500).send("Error creating milestone");
    }
});

/* GET /milestones/:pid/:mno/edit — edit milestone (admin) */
router.get("/:pid/:mno/edit", requireAdmin, async (req, res) => {
    try {
        const milestone = await Milestones.getById(req.params.pid, req.params.mno);
        const participants = await Participants.getAll();

        if (!milestone) return res.status(404).send("Milestone not found");

        res.render("milestones/edit", {
            title: "Edit Milestone",
            milestone,
            participants
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading edit form");
    }
});

/* POST /milestones/:pid/:mno/edit — update milestone (admin) */
router.post("/:pid/:mno/edit", requireAdmin, async (req, res) => {
    try {
        const updates = {
            title: req.body.MilestoneTitle,
            achieved_date: req.body.MilestoneDate
        };

        await Milestones.update(req.params.pid, req.params.mno, updates);
        res.redirect(`/milestones/participant/${req.params.pid}`);

    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating milestone");
    }
});

/* POST /milestones/:pid/:mno/delete — delete milestone (admin) */
router.post("/:pid/:mno/delete", requireAdmin, async (req, res) => {
    try {
        await Milestones.delete(req.params.pid, req.params.mno);
        res.redirect(`/milestones/participant/${req.params.pid}`);

    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting milestone");
    }
});

/* GET /milestones/:pid/:mno — show a single milestone */
router.get("/:pid/:mno", requireLogin, async (req, res) => {
    try {
        const milestone = await Milestones.getById(req.params.pid, req.params.mno);
        if (!milestone) return res.status(404).send("Milestone not found");

        const role = (req.session.access_level || "").toLowerCase();
        const isAuthorized =
            role === "manager" ||
            role === "admin" ||
            String(req.session.user_id) === String(milestone.participant_id);

        if (!isAuthorized) {
            return res.status(403).send("Unauthorized Access");
        }

        res.render("milestones/show", {
            title: "Milestone Details",
            milestone
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading details");
    }
});

module.exports = router;
