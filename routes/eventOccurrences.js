// routes/eventOccurrences.js

const express = require("express");
const router = express.Router();

const { requireAdmin, requireLogin } = require("../middleware/auth");

const EventOccurrences = require("../models/eventOccurrences");
const Events = require("../models/events");

/* ============================================================
   LIST EVENT OCCURRENCES
============================================================ */
router.get("/", requireLogin, async (req, res) => {
    try {
        // SQL version: already includes event_name via JOIN
        const occurrences = await EventOccurrences.getAll();

        res.render("eventOccurrences/index", {
            title: "Event Occurrences",
            occurrences,
            session: req.session
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Database Error");
    }
});

/* ============================================================
   NEW OCCURRENCE
============================================================ */

// Show form
router.get("/new", requireAdmin, async (req, res) => {
    try {
        const events = await Events.getAll(); // Needed for dropdown

        res.render("eventOccurrences/new", {
            title: "New Event Occurrence",
            events,
            session: req.session
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading form");
    }
});

// Submit new occurrence
router.post("/new", requireAdmin, async (req, res) => {
    try {
        const newOccurrence = {
            event_id: Number(req.body.EventID),
            starts_at: req.body.EventDateTimeStart,
            ends_at: req.body.EventDateTimeEnd,
            location: req.body.EventLocation,
            capacity: Number(req.body.EventCapacity),
            registration_deadline: req.body.EventRegistrationDeadline
        };

        await EventOccurrences.create(newOccurrence);
        res.redirect("/eventOccurrences");

    } catch (err) {
        console.error(err);
        res.status(500).send("Error creating occurrence");
    }
});

/* ============================================================
   EDIT OCCURRENCE
============================================================ */

// Show form
router.get("/:id/edit", requireAdmin, async (req, res) => {
    try {
        const occurrence = await EventOccurrences.getById(req.params.id);
        const events = await Events.getAll();

        if (!occurrence) return res.status(404).send("Occurrence not found");

        res.render("eventOccurrences/edit", {
            title: "Edit Event Occurrence",
            occurrence,
            events,
            session: req.session
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading edit form");
    }
});

// Submit edits
router.post("/:id/edit", requireAdmin, async (req, res) => {
    try {
        const updates = {
            event_id: Number(req.body.EventID),
            starts_at: req.body.EventDateTimeStart,
            ends_at: req.body.EventDateTimeEnd,
            location: req.body.EventLocation,
            capacity: Number(req.body.EventCapacity),
            registration_deadline: req.body.EventRegistrationDeadline
        };

        await EventOccurrences.update(req.params.id, updates);
        res.redirect("/eventOccurrences");

    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating occurrence");
    }
});

/* ============================================================
   DELETE OCCURRENCE
============================================================ */
router.post("/:id/delete", requireAdmin, async (req, res) => {
    try {
        await EventOccurrences.delete(req.params.id);
        res.redirect("/eventOccurrences");

    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting occurrence");
    }
});

/* ============================================================
   SHOW SINGLE OCCURRENCE
============================================================ */
router.get("/:id", requireLogin, async (req, res) => {
    try {
        const occurrence = await EventOccurrences.getById(req.params.id);

        if (!occurrence) return res.status(404).send("Occurrence not found");

        res.render("eventOccurrences/show", {
            title: occurrence.event_name
                ? `${occurrence.event_name} Occurrence`
                : "Event Occurrence Details",
            occurrence,
            session: req.session
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading details");
    }
});

module.exports = router;
