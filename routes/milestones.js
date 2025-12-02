// routes/milestones.js

const express = require("express");
const router = express.Router();

const { requireAdmin, requireLogin } = require("../middleware/auth");
const Milestones = require("../models/milestones");
const Participants = require("../models/participants");

/* ============================================================
   LIST MILESTONES (LOGIN REQUIRED)
============================================================ */
router.get("/", requireLogin, async (req, res) => {
    try {
        const milestones = await Milestones.getAll();
        res.render("milestones/index", {
            title: "Milestones",
            milestones
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Database Error");
    }
});


/* ============================================================
   NEW MILESTONE (ADMIN ONLY)
============================================================ */

// Show form
router.get("/new", requireAdmin, async (req, res) => {
    try {
        // Need participants for the dropdown menu
        const participants = await Participants.getAll();
        
        res.render("milestones/new", {
            title: "Add Milestone",
            participants
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
        res.redirect("/milestones");

    } catch (err) {
        console.error(err);
        res.status(500).send("Error creating milestone");
    }
});


/* ============================================================
   EDIT MILESTONE (ADMIN ONLY)
   Note: Route changed to include PID and MNO
============================================================ */

// Show edit form
router.get("/:pid/:mno/edit", requireAdmin, async (req, res) => {
    try {
        // We need both IDs to find the specific milestone
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
            // We usually don't let them change the Participant ID on an edit 
            // because that breaks the Primary Key, so we only update title/date.
            title: req.body.MilestoneTitle,
            achieved_date: req.body.MilestoneDate
        };

        await Milestones.update(req.params.pid, req.params.mno, updates);
        res.redirect("/milestones");

    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating milestone");
    }
});


/* ============================================================
   DELETE MILESTONE (ADMIN ONLY)
   Note: Route changed to include PID and MNO
============================================================ */
router.post("/:pid/:mno/delete", requireAdmin, async (req, res) => {
    try {
        await Milestones.delete(req.params.pid, req.params.mno);
        res.redirect("/milestones");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting milestone");
    }
});


/* ============================================================
   SHOW MILESTONE (LOGIN REQUIRED)
   Note: Route changed to include PID and MNO
============================================================ */
router.get("/:pid/:mno", requireLogin, async (req, res) => {
    try {
        // The getById model now performs the join, so we don't need a separate participant query
        const milestone = await Milestones.getById(req.params.pid, req.params.mno);

        if (!milestone) return res.status(404).send("Milestone not found");

        res.render("milestones/show", {
            title: "Milestone Details",
            milestone
            // 'participant' data is already inside the 'milestone' object due to the join
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading details");
    }
});

module.exports = router;