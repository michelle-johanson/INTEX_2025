// routes/eventOccurrences.js
// Handles scheduled sessions of event templates

const express = require("express");
const router = express.Router();

const { requireAdmin, requireLogin } = require("../middleware/auth");

const EventOccurrences = require("../models/eventOccurrences");
const Events = require("../models/events");

/* ============================================================
   LIST EVENT OCCURRENCES (LOGIN REQUIRED)
============================================================ */
router.get("/", requireLogin, (req, res) => {
    const occurrences = EventOccurrences.getAll();

    // also bring event templates to show names
    const events = Events.getAll();

    // join for display
    const enhanced = occurrences.map(o => {
        const event = events.find(e => e.EventID === o.EventID);
        return {
            ...o,
            EventName: event ? event.EventName : "Unknown Event"
        };
    });

    res.render("eventOccurrences/index", {
        title: "Event Occurrences",
        occurrences: enhanced
    });
});


/* ============================================================
   CREATE EVENT OCCURRENCE (ADMIN ONLY)
============================================================ */

// Show form
router.get("/new", requireAdmin, (req, res) => {
    res.render("eventOccurrences/new", {
        title: "New Event Occurrence",
        events: Events.getAll()
    });
});

// Submit new occurrence
router.post("/new", requireAdmin, (req, res) => {
    EventOccurrences.create({
        EventID: Number(req.body.EventID),
        EventDateTimeStart: req.body.EventDateTimeStart,
        EventDateTimeEnd: req.body.EventDateTimeEnd,
        EventLocation: req.body.EventLocation,
        EventCapacity: Number(req.body.EventCapacity),
        EventRegistrationDeadline: req.body.EventRegistrationDeadline
    });

    res.redirect("/eventOccurrences");
});


/* ============================================================
   EDIT EVENT OCCURRENCE (ADMIN ONLY)
============================================================ */

// Show form
router.get("/:id/edit", requireAdmin, (req, res) => {
    const occurrence = EventOccurrences.getById(req.params.id);
    if (!occurrence) return res.status(404).send("Occurrence not found");

    res.render("eventOccurrences/edit", {
        title: "Edit Event Occurrence",
        occurrence,
        events: Events.getAll()
    });
});

// Submit edits
router.post("/:id/edit", requireAdmin, (req, res) => {
    EventOccurrences.update(req.params.id, {
        EventID: Number(req.body.EventID),
        EventDateTimeStart: req.body.EventDateTimeStart,
        EventDateTimeEnd: req.body.EventDateTimeEnd,
        EventLocation: req.body.EventLocation,
        EventCapacity: Number(req.body.EventCapacity),
        EventRegistrationDeadline: req.body.EventRegistrationDeadline
    });

    res.redirect("/eventOccurrences");
});


/* ============================================================
   DELETE OCCURRENCE (ADMIN ONLY)
============================================================ */
router.post("/:id/delete", requireAdmin, (req, res) => {
    EventOccurrences.delete(req.params.id);
    res.redirect("/eventOccurrences");
});


/* ============================================================
   SHOW SINGLE OCCURRENCE (LOGIN REQUIRED)
============================================================ */
router.get("/:id", requireLogin, (req, res) => {
    const occurrence = EventOccurrences.getById(req.params.id);
    if (!occurrence) return res.status(404).send("Occurrence not found");

    const event = Events.getById(occurrence.EventID);

    res.render("eventOccurrences/show", {
        title: "Event Occurrence Details",
        occurrence,
        event
    });
});

module.exports = router;
