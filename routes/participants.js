// routes/participants.js

const express = require("express");
const router = express.Router();

const { requireAdmin, requireLogin } = require("../middleware/auth");
const Participants = require("../models/fakeParticipants");

/* ============================================================
    IMPORTANT:
    ORDER MATTERS — static routes MUST come before dynamic :id
============================================================ */


/* ============================================================
    LIST PARTICIPANTS  (LOGIN REQUIRED)
============================================================ */
router.get("/", requireLogin, (req, res) => {
    const participants = Participants.getAll();
    res.render("participants/index", {
        title: "Participants",
        participants
    });
});


/* ============================================================
    CREATE NEW PARTICIPANT  (ADMIN ONLY)
============================================================ */

// Show form
router.get("/new", requireAdmin, (req, res) => {
    res.render("participants/new", {
        title: "Add Participant"
    });
});

// Handle form submit
router.post("/new", requireAdmin, (req, res) => {
    Participants.add({
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        email: req.body.email,
        phone: req.body.phone,
        program: req.body.program
    });

    res.redirect("/participants");
});


/* ============================================================
    EDIT PARTICIPANT  (ADMIN ONLY)
============================================================ */

// Show edit form
router.get("/:id/edit", requireAdmin, (req, res) => {
    const participant = Participants.getById(req.params.id);

    if (!participant) {
        return res.status(404).send("Participant not found");
    }

    res.render("participants/edit", {
        title: "Edit Participant",
        participant
    });
});

// Handle edit submit
router.post("/:id/edit", requireAdmin, (req, res) => {
    Participants.update(req.params.id, {
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        email: req.body.email,
        phone: req.body.phone,
        program: req.body.program
    });

    res.redirect("/participants");
});


/* ============================================================
    DELETE PARTICIPANT  (ADMIN ONLY)
============================================================ */
router.post("/:id/delete", requireAdmin, (req, res) => {
    Participants.delete(req.params.id);
    res.redirect("/participants");
});


/* ============================================================
    SHOW SINGLE PARTICIPANT  (LOGIN REQUIRED)
============================================================ */
router.get("/:id", requireLogin, (req, res) => {
    const participant = Participants.getById(req.params.id);

    if (!participant) {
        return res.status(404).send("Participant not found");
    }

    res.render("participants/show", {
        title: "Participant Details",
        participant
    });
});


module.exports = router;
