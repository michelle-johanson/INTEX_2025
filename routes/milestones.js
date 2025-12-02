// routes/milestones.js

const express = require("express");
const router = express.Router();

const { requireAdmin, requireLogin } = require("../middleware/auth");
const Milestones = require("../models/fakeMilestones");
const Participants = require("../models/fakeParticipants");

/* ============================================================
    LIST MILESTONES (LOGIN REQUIRED)
============================================================ */
router.get("/", requireLogin, (req, res) => {
    const milestones = Milestones.getAll();
    res.render("milestones/index", {
        title: "Milestones",
        milestones
    });
});


/* ============================================================
    NEW MILESTONE (ADMIN ONLY)
============================================================ */

// Show form
router.get("/new", requireAdmin, (req, res) => {
    res.render("milestones/new", {
        title: "Add Milestone",
        participants: Participants.getAll()
    });
});

// Handle submit
router.post("/new", requireAdmin, (req, res) => {
    Milestones.add({
        title: req.body.title,
        description: req.body.description,
        participant_id: Number(req.body.participant_id),
        completed: req.body.completed === "on"
    });

    res.redirect("/milestones");
});


/* ============================================================
    EDIT MILESTONE (ADMIN ONLY)
============================================================ */

router.get("/:id/edit", requireAdmin, (req, res) => {
    const milestone = Milestones.getById(req.params.id);
    if (!milestone) return res.status(404).send("Milestone not found");

    res.render("milestones/edit", {
        title: "Edit Milestone",
        milestone,
        participants: Participants.getAll()
    });
});

router.post("/:id/edit", requireAdmin, (req, res) => {
    Milestones.update(req.params.id, {
        title: req.body.title,
        description: req.body.description,
        participant_id: Number(req.body.participant_id),
        completed: req.body.completed === "on"
    });

    res.redirect("/milestones");
});


/* ============================================================
    DELETE MILESTONE (ADMIN ONLY)
============================================================ */
router.post("/:id/delete", requireAdmin, (req, res) => {
    Milestones.delete(req.params.id);
    res.redirect("/milestones");
});


/* ============================================================
    SHOW MILESTONE (LOGIN REQUIRED)
============================================================ */
router.get("/:id", requireLogin, (req, res) => {
    const milestone = Milestones.getById(req.params.id);
    if (!milestone) return res.status(404).send("Milestone not found");

    res.render("milestones/show", {
        title: "Milestone Details",
        milestone,
        participant: Participants.getById(milestone.participant_id)
    });
});

module.exports = router;
