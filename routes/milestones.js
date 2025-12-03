// routes/milestones.js

const express = require("express");
const router = express.Router();

const { requireAdmin, requireLogin } = require("../middleware/auth");
const Milestones = require("../models/milestones");
const Participants = require("../models/participants");

/* ============================================================
   MAIN INDEX ROUTE (SPLIT VIEW LOGIC)
   - If Manager: Shows Directory of People (manager_index.ejs)
   - If User: Shows their OWN milestones (index.ejs)
============================================================ */
/* ============================================================
   MAIN INDEX ROUTE
============================================================ */
router.get("/", requireLogin, async (req, res) => {
    try {
        // DEBUGGING: Check your terminal to see what this prints!
        console.log("Current User Role:", req.session.access_level);

        // NORMALIZE THE CHECK: 
        // Convert to lowercase to handle "Manager", "manager", "ADMIN", etc.
        const role = (req.session.access_level || "").toLowerCase();

        // SCENARIO 1: MANAGER LOGGED IN
        if (role === "manager" || role === "admin") {
            const participants = await Participants.getAll();
            
            // Render the Directory View
            return res.render("milestones/manager_index", {
                title: "Manage Milestones",
                participants
            });
        }

        // SCENARIO 2: PARTICIPANT LOGGED IN
        const myMilestones = await Milestones.getByParticipant(req.session.userID);
        
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
   MANAGER DRILL-DOWN (View specific person's list)
   URL: /milestones/participant/5
============================================================ */
router.get("/participant/:id", requireAdmin, async (req, res) => {
    try {
        const participantId = req.params.id;
        
        // Fetch milestones for this specific person
        const milestones = await Milestones.getByParticipant(participantId);
        
        // Fetch participant details just for the name in the header
        const participant = await Participants.getById(participantId);

        if (!participant) return res.status(404).send("Participant not found");

        // We REUSE 'index.ejs' but populate it with this person's data
        res.render("milestones/index", {
            title: `${participant.first_name}'s Milestones`,
            milestones: milestones,
            participantName: `${participant.first_name}'s`
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading participant milestones");
    }
});


/* ============================================================
   NEW MILESTONE (ADMIN ONLY)
============================================================ */

// Show form
router.get("/new", requireAdmin, async (req, res) => {
    try {
        const participants = await Participants.getAll();
        
        // Check if we passed a specific participant ID in the query (optional UX improvement)
        // Example link: /milestones/new?participant_id=5
        const selectedId = req.query.participant_id;

        res.render("milestones/new", {
            title: "Add Milestone",
            participants,
            selectedId // Pass this to auto-select the dropdown
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading form");
    }
});

// Submit form
router.post("/new", requireAdmin, async (req, res) => {
    try {
        const newMilestone = {
            participant_id: Number(req.body.ParticipantID),
            title: req.body.MilestoneTitle,
            achieved_date: req.body.MilestoneDate
        };

        await Milestones.create(newMilestone);
        
        // Redirect back to that specific user's list
        res.redirect(`/milestones/participant/${newMilestone.participant_id}`);

    } catch (err) {
        console.error(err);
        res.status(500).send("Error creating milestone");
    }
});


/* ============================================================
   EDIT MILESTONE (ADMIN ONLY)
   URL: /:pid/:mno/edit
============================================================ */

// Show edit form
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

// Submit edit
router.post("/:pid/:mno/edit", requireAdmin, async (req, res) => {
    try {
        const updates = {
            title: req.body.MilestoneTitle,
            achieved_date: req.body.MilestoneDate
        };

        await Milestones.update(req.params.pid, req.params.mno, updates);
        
        // Redirect back to that specific user's list
        res.redirect(`/milestones/participant/${req.params.pid}`);

    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating milestone");
    }
});


/* ============================================================
   DELETE MILESTONE (ADMIN ONLY)
   URL: /:pid/:mno/delete
============================================================ */
router.post("/:pid/:mno/delete", requireAdmin, async (req, res) => {
    try {
        await Milestones.delete(req.params.pid, req.params.mno);
        
        // Redirect back to that specific user's list
        res.redirect(`/milestones/participant/${req.params.pid}`);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting milestone");
    }
});


/* ============================================================
   SHOW SINGLE MILESTONE (LOGIN REQUIRED)
   URL: /:pid/:mno
============================================================ */
router.get("/:pid/:mno", requireLogin, async (req, res) => {
    try {
        const milestone = await Milestones.getById(req.params.pid, req.params.mno);

        if (!milestone) return res.status(404).send("Milestone not found");

        // --- SECURITY FIX ---
        // Get role safely and convert to lowercase
        const role = (req.session.access_level || "").toLowerCase();

        // Allow if role is manager/admin OR if the user owns the milestone
        const isAuthorized = (role === 'manager' || role === 'admin') || 
                             (req.session.userID === milestone.participant_id);

        if (!isAuthorized) {
             return res.status(403).send("Unauthorized Access");
        }
        // --------------------

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