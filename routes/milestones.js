// routes/milestones.js

const express = require("express");
const router = express.Router();

const { requireAdmin, requireLogin } = require("../middleware/auth");
const Milestones = require("../models/milestones");
const Participants = require("../models/participants");

/* ============================================================
   LEVEL 1: MAIN INDEX ROUTE
   - If Manager: Shows List of Milestone Titles
   - If User: Shows their OWN milestones
============================================================ */
router.get("/", requireLogin, async (req, res) => {
    try {
        const role = (req.session.access_level || "").toLowerCase();

        // SCENARIO 1: MANAGER LOGGED IN
        if (role === "manager" || role === "admin") {
            const milestoneTypes = await Milestones.getUniqueTitles();
            
            return res.render("milestones/types_index", { 
                title: "Milestone Achievements Directory",
                milestoneTypes: milestoneTypes
            });
        }

        // SCENARIO 2: PARTICIPANT LOGGED IN
        // Validate ID
        const myId = Number(req.session.userID);
        if (!myId) {
            console.error("Milestone Route Error: No User ID in session.");
            return res.redirect('/auth/login');
        }

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

/* ============================================================
   LEVEL 2: DRILL-DOWN (View people who earned a specific Milestone Type)
============================================================ */
router.get("/type/:title", requireAdmin, async (req, res) => {
    try {
        const milestoneTitle = req.params.title;
        const participants = await Milestones.getParticipantsByTitle(milestoneTitle);

        res.render("milestones/participants_by_type", {
            title: `Participants with: ${milestoneTitle}`,
            participants: participants,
            milestoneTitle: milestoneTitle
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading participants by milestone type");
    }
});

/* ============================================================
   EDIT MILESTONE TYPE (ADMIN ONLY)
============================================================ */
router.get("/type/:title/edit", requireAdmin, async (req, res) => {
    try {
        const oldTitle = req.params.title;
        res.render("milestones/type_edit", {
            title: `Rename Milestone Type`,
            oldTitle: oldTitle,
            session: req.session
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading edit form");
    }
});

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

/* ============================================================
   DELETE MILESTONE TYPE (ADMIN ONLY)
============================================================ */
router.post("/type/:title/delete", requireAdmin, async (req, res) => {
    try {
        const titleToDelete = req.params.title;
        await Milestones.deleteByTitle(titleToDelete);
        res.redirect(`/milestones`);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting milestone type");
    }
});


/* ============================================================
   LEVEL 3: PARTICIPANT/MANAGER DRILL-DOWN
   URL: /milestones/participant/5
============================================================ */
router.get("/participant/:id", requireLogin, async (req, res) => {
    try {
        const participantId = Number(req.params.id);
        const loggedInUserId = Number(req.session.userID);
        const role = (req.session.access_level || "").toLowerCase();

        // AUTHORIZATION CHECK
        const isManager = role === 'manager' || role === 'admin';
        const isOwner = loggedInUserId === participantId;

        if (!isManager && !isOwner) {
            return res.status(403).send("Unauthorized Access: You can only view your own milestones.");
        }
        
        // Fetch milestones
        const milestones = await Milestones.getByParticipant(participantId);
        
        // Fetch participant details
        const participant = await Participants.getById(participantId);

        if (!participant) return res.status(404).send("Participant not found");

        res.render("milestones/index", {
            title: `${participant.first_name}'s Milestones`,
            milestones: milestones,
            participantName: `${participant.first_name}'s`,
            participant: participant 
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading participant milestones");
    }
});


/* ============================================================
   NEW MILESTONE
============================================================ */
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


/* ============================================================
   EDIT MILESTONE
============================================================ */
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


/* ============================================================
   DELETE MILESTONE
============================================================ */
router.post("/:pid/:mno/delete", requireAdmin, async (req, res) => {
    try {
        await Milestones.delete(req.params.pid, req.params.mno);
        res.redirect(`/milestones/participant/${req.params.pid}`);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting milestone");
    }
});


/* ============================================================
   SHOW SINGLE MILESTONE
============================================================ */
router.get("/:pid/:mno", requireLogin, async (req, res) => {
    try {
        const milestone = await Milestones.getById(req.params.pid, req.params.mno);

        if (!milestone) return res.status(404).send("Milestone not found");

        // SECURITY CHECK
        const role = (req.session.access_level || "").toLowerCase();
        const isAuthorized = (role === 'manager' || role === 'admin') || 
                             (String(req.session.userID) === String(milestone.participant_id));

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