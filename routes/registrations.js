// routes/registrations.js

const express = require("express");
const router = express.Router();

const { requireAdmin, requireLogin } = require("../middleware/auth");

const Registrations = require("../models/registrations");
const Participants = require("../models/participants");
const EventOccurrences = require("../models/eventOccurrences");

/* ============================================================
   LIST REGISTRATIONS (LOGIN REQUIRED)
============================================================ */
router.get("/", requireLogin, async (req, res) => {
    try {
        // Model handles the JOINs now
        const registrations = await Registrations.getAll();

        res.render("registrations/index", {
            title: "Registrations",
            registrations
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Database Error");
    }
});


/* ============================================================
   NEW REGISTRATION (ADMIN ONLY)
============================================================ */

// Show form
router.get("/new", requireAdmin, async (req, res) => {
    try {
        const participants = await Participants.getAll();
        const occurrences = await EventOccurrences.getAll();

        res.render("registrations/new", {
            title: "New Registration",
            participants,
            occurrences
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading form");
    }
});

// Submit new registration
router.post("/new", requireAdmin, async (req, res) => {
    try {
        const newRegistration = {
            event_occurrence_id: Number(req.body.EventOccurrenceID),
            participant_id: Number(req.body.ParticipantID),
            status: req.body.RegistrationStatus,
            attended: req.body.RegistrationAttendedFlag === "on", // Convert 'on' to boolean
            check_in_time: req.body.RegistrationCheckInTime || null,
            created_at: req.body.RegistrationCreatedAt || new Date()
        };

        await Registrations.create(newRegistration);
        res.redirect("/registrations");

    } catch (err) {
        console.error(err);
        res.status(500).send("Error creating registration");
    }
});


/* ============================================================
   EDIT REGISTRATION (ADMIN ONLY)
   URL: /:oid/:pid/edit
============================================================ */
router.get("/:oid/:pid/edit", requireAdmin, async (req, res) => {
    try {
        const registration = await Registrations.getByIds(req.params.oid, req.params.pid);
        const participants = await Participants.getAll();
        const occurrences = await EventOccurrences.getAll();

        if (!registration) return res.status(404).send("Registration not found");

        res.render("registrations/edit", {
            title: "Edit Registration",
            registration,
            participants,
            occurrences
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading edit form");
    }
});

router.post("/:oid/:pid/edit", requireAdmin, async (req, res) => {
    try {
        const updates = {
            status: req.body.RegistrationStatus,
            attended: req.body.RegistrationAttendedFlag === "on",
            check_in_time: req.body.RegistrationCheckInTime || null,
            created_at: req.body.RegistrationCreatedAt
        };

        await Registrations.update(req.params.oid, req.params.pid, updates);
        res.redirect("/registrations");

    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating registration");
    }
});


/* ============================================================
   DELETE REGISTRATION (ADMIN ONLY)
============================================================ */
router.post("/:oid/:pid/delete", requireAdmin, async (req, res) => {
    try {
        await Registrations.delete(req.params.oid, req.params.pid);
        res.redirect("/registrations");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting registration");
    }
});


/* ============================================================
   SHOW SINGLE REGISTRATION (LOGIN REQUIRED)
============================================================ */
router.get("/:oid/:pid", requireLogin, async (req, res) => {
    try {
        const registration = await Registrations.getByIds(req.params.oid, req.params.pid);

        if (!registration) return res.status(404).send("Registration not found");

        res.render("registrations/show", {
            title: "Registration Details",
            registration
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading details");
    }
});

module.exports = router;