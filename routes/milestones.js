// routes/milestones.js

const express = require("express");
const router = express.Router();

const { requireAdmin, requireLogin } = require("../middleware/auth");
const Milestones = require("../models/milestones");
const Participants = require("../models/participants");

/* ============================================================
   LEVEL 1: MAIN INDEX ROUTE
   - If Manager: Shows List of Milestone Titles (With Search)
   - If User: Shows their OWN milestones
============================================================ */
router.get("/", requireLogin, async (req, res) => {
    try {
        const role = (req.session.access_level || "").toLowerCase();

        // SCENARIO 1: MANAGER LOGGED IN
        if (role === "manager" || role === "admin") {
            const searchTerm = req.query.search || "";
            const milestoneTypes = await Milestones.getUniqueTitles(searchTerm);
            
            return res.render("milestones/types_index", { 
                title: "Milestone Achievements Directory",
                milestoneTypes: milestoneTypes,
                searchTerm: searchTerm,
                session: req.session
            });
        }

        // SCENARIO 2: PARTICIPANT LOGGED IN
        // Robust ID Check
        const myId = (req.session.user && req.session.user.participant_id) || 
                     req.session.participant_id || 
                     req.session.userID;

        if (!myId) {
            return res.redirect('/auth/login');
        }

        const myMilestones = await Milestones.getByParticipant(myId);
        
        res.render("milestones/index", {
            title: "My Milestones",
            milestones: myMilestones,
            participantName: "My",
            session: req.session
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Database Error");
    }
});

/* ============================================================
   ADMIN: MANAGE ALL PARTICIPANTS (Directory)
   URL: /milestones/manage
============================================================ */
router.get("/manage", requireAdmin, async (req, res) => {
    try {
        const searchTerm = req.query.search || null; 
        
        // Fetch participants using the search logic in the model
        const participants = await Participants.getAll(searchTerm);

        res.render("milestones/manage", { 
            title: "Manage Milestones",
            participants: participants,
            searchTerm: searchTerm || "",
            session: req.session
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading participant directory");
    }
});

/* ============================================================
   LEVEL 2: DRILL-DOWN (View people who earned a specific Milestone Type)
   URL: /milestones/type/Python%20Coding%20Certificate
============================================================ */
router.get("/type/:title", requireAdmin, async (req, res) => {
    try {
        const milestoneTitle = req.params.title;
        const searchTerm = req.query.search || ""; 
        
        let participants = await Milestones.getParticipantsByTitle(milestoneTitle);

        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            participants = participants.filter(p => 
                (p.first_name && p.first_name.toLowerCase().includes(lowerSearch)) ||
                (p.last_name && p.last_name.toLowerCase().includes(lowerSearch)) ||
                (p.email && p.email.toLowerCase().includes(lowerSearch))
            );
        }

        res.render("milestones/participants_by_type", { 
            title: `Participants with: ${milestoneTitle}`,
            participants: participants,
            milestoneTitle: milestoneTitle,
            searchTerm: searchTerm,
            session: req.session
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading participants by milestone type");
    }
});

/* ============================================================
   EDIT MILESTONE TYPE (ADMIN ONLY)
   URL: /milestones/type/:title/edit
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
   URL: /milestones/type/:title/delete
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
   LEVEL 3: MANAGER/PARTICIPANT DRILL-DOWN (View specific person's list)
   URL: /milestones/participant/5
   --- FIXED: ROBUST ID CHECK ---
============================================================ */
router.get("/participant/:id", requireLogin, async (req, res) => { 
    try {
        const participantId = req.params.id;
        
        // FIX: Check all possible locations for the User ID
        const loggedInUserId = (req.session.user && req.session.user.participant_id) || 
                               req.session.participant_id || 
                               req.session.userID;

        const role = (req.session.access_level || "").toLowerCase();
        
        // AUTHORIZATION CHECK: Admin OR Owner
        const isManager = role === 'manager' || role === 'admin';
        // Ensure both IDs are strings for comparison
        const isOwner = String(loggedInUserId) === String(participantId);

        if (!isManager && !isOwner) {
            return res.status(403).send("Unauthorized Access: You can only view your own milestones.");
        }
        
        const milestones = await Milestones.getByParticipant(participantId);
        const participant = await Participants.getById(participantId);

        if (!participant) return res.status(404).send("Participant not found");

        res.render("milestones/index", {
            title: `${participant.first_name}'s Milestones`,
            milestones: milestones,
            participantName: `${participant.first_name}'s`,
            participant: participant,
            session: req.session
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading participant milestones");
    }
});


/* ============================================================
   NEW MILESTONE (ADMIN ONLY)
============================================================ */
router.get("/new", requireAdmin, async (req, res) => {
    try {
        const participants = await Participants.getAll();
        const selectedId = req.query.participant_id;

        res.render("milestones/new", {
            title: "Add Milestone",
            participants,
            selectedId,
            session: req.session
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
   EDIT MILESTONE (ADMIN ONLY)
============================================================ */
router.get("/:pid/:mno/edit", requireAdmin, async (req, res) => {
    try {
        const milestone = await Milestones.getById(req.params.pid, req.params.mno);
        const participants = await Participants.getAll();

        if (!milestone) return res.status(404).send("Milestone not found");

        res.render("milestones/edit", {
            title: "Edit Milestone",
            milestone,
            participants,
            session: req.session
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
   DELETE MILESTONE (ADMIN ONLY)
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
   SHOW SINGLE MILESTONE (LOGIN REQUIRED)
============================================================ */
router.get("/:pid/:mno", requireLogin, async (req, res) => {
    try {
        const milestone = await Milestones.getById(req.params.pid, req.params.mno);
        if (!milestone) return res.status(404).send("Milestone not found");

        const role = (req.session.access_level || "").toLowerCase();
        
        // Robust ID Check here too
        const loggedInUserId = (req.session.user && req.session.user.participant_id) || 
                               req.session.participant_id || 
                               req.session.userID;

        const isAuthorized = (role === 'manager' || role === 'admin') || 
                             (String(loggedInUserId) === String(milestone.participant_id));

        if (!isAuthorized) {
             return res.status(403).send("Unauthorized Access");
        }

        res.render("milestones/show", {
            title: "Milestone Details",
            milestone,
            session: req.session
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading details");
    }
});

module.exports = router;