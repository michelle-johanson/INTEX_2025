// routes/milestones.js

const express = require("express");
const router = express.Router();

const { requireAdmin, requireLogin } = require("../middleware/auth");
const Milestones = require("../models/milestones");   // NEW MODEL
const Participants = require("../models/participants");

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

// Submit form
router.post("/new", requireAdmin, (req, res) => {
    Milestones.create({
        ParticipantID: Number(req.body.ParticipantID),
        MilestoneTitle: req.body.MilestoneTitle,
        MilestoneDate: req.body.MilestoneDate
    });

    res.redirect("/milestones");
});


/* ============================================================
    EDIT MILESTONE (ADMIN ONLY)
============================================================ */

// Show edit form
router.get("/:id/edit", requireAdmin, (req, res) => {
    const milestone = Milestones.getById(req.params.id);
    if (!milestone) return res.status(404).send("Milestone not found");

    res.render("milestones/edit", {
        title: "Edit Milestone",
        milestone,
        participants: Participants.getAll()
    });
});

// Submit edit
router.post("/:id/edit", requireAdmin, (req, res) => {
    Milestones.update(req.params.id, {
        ParticipantID: Number(req.body.ParticipantID),
        MilestoneTitle: req.body.MilestoneTitle,
        MilestoneDate: req.body.MilestoneDate
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

    const participant = Participants.getById(milestone.ParticipantID);

    res.render("milestones/show", {
        title: "Milestone Details",
        milestone,
        participant
    });
});

module.exports = router;
