// routes/eventOccurrences.js

const express = require("express");
const router = express.Router();

const { requireAdmin, requireLogin } = require("../middleware/auth");

const EventOccurrences = require("../models/eventOccurrences");
const Events = require("../models/events");

/* ============================================================
   LIST EVENT OCCURRENCES (LOGIN REQUIRED)
============================================================ */
router.get("/", requireLogin, async (req, res) => {
    try {
        // The model now performs the SQL Join, so 'occurrences' 
        // already has 'event_name' inside it!
        const occurrences = await EventOccurrences.getAll();

        res.render("eventOccurrences/index", {
            title: "Event Occurrences",
            occurrences
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Database Error");
    }
});


/* ============================================================
   CREATE EVENT OCCURRENCE (ADMIN ONLY)
============================================================ */

// Show form
router.get("/new", requireAdmin, async (req, res) => {
    try {
        // We still need the list of events for the <select> dropdown
        const events = await Events.getAll();

        res.render("eventOccurrences/new", {
            title: "New Event Occurrence",
            events
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading form");
    }
});

// Submit new occurrence
router.post("/new", requireAdmin, async (req, res) => {
    try {
        // MAP FORM DATA TO DATABASE COLUMNS
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
   EDIT EVENT OCCURRENCE (ADMIN ONLY)
============================================================ */

// Show form
router.get("/:id/edit", requireAdmin, async (req, res) => {
    try {
        const occurrence = await EventOccurrences.getById(req.params.id);
        const events = await Events.getAll(); // Need for dropdown

        if (!occurrence) return res.status(404).send("Occurrence not found");

        res.render("eventOccurrences/edit", {
            title: "Edit Event Occurrence",
            occurrence,
            events
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
   DELETE OCCURRENCE (ADMIN ONLY)
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
   SHOW SINGLE OCCURRENCE (LOGIN REQUIRED)
============================================================ */
router.get("/:id", requireLogin, async (req, res) => {
    try {
        // Our getById already joins the Event info!
        const occurrence = await EventOccurrences.getById(req.params.id);

        if (!occurrence) return res.status(404).send("Occurrence not found");

        // We don't need to fetch 'event' separately anymore, 
        // the name is inside 'occurrence.event_name'
        res.render("eventOccurrences/show", {
            title: "Event Occurrence Details",
            occurrence
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading details");
    }
});

module.exports = router;