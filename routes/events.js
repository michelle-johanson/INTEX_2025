const express = require("express");
const router = express.Router();
const { requireAdmin, requireLogin } = require("../middleware/auth");

const Events = require("../models/events");
const EventOccurrences = require("../models/eventOccurrences");

/* GET /events — list all event types */
router.get("/", requireLogin, async (req, res) => {
    try {
        const query = req.query.q || req.query.search || "";
        const events = await Events.getAll(query);

        res.render("events/index", {
            title: "Event Types",
            events,
            query,
            session: req.session
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading events");
    }
});

/* GET /events/new — new event type form (admin) */
router.get("/new", requireAdmin, (req, res) => {
    res.render("events/new", { 
        title: "Create New Event Type",
        session: req.session 
    });
});

/* POST /events/new — create event type (admin) */
router.post("/new", requireAdmin, async (req, res) => {
    try {
        await Events.create({
            name: req.body.EventName,
            description: req.body.EventDescription,
            type: req.body.EventType,
            recurrence_pattern: req.body.EventRecurrencePattern,
            default_capacity: Number(req.body.EventDefaultCapacity)
        });

        res.redirect("/events");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error creating event");
    }
});

/* GET /events/:id — view event and its occurrences */
router.get("/:id", requireLogin, async (req, res) => {
    try {
        const event = await Events.getById(req.params.id);
        if (!event) return res.status(404).send("Event not found");

        const query = req.query.q || req.query.search || "";
        const occurrences = await EventOccurrences.getByEventId(req.params.id, query);

        res.render("events/show", {
            title: event.name,
            event,
            occurrences,
            query,
            session: req.session
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading event");
    }
});

/* GET /events/:id/edit — edit event type form (admin) */
router.get("/:id/edit", requireAdmin, async (req, res) => {
    try {
        const event = await Events.getById(req.params.id);
        if (!event) return res.status(404).send("Event not found");

        res.render("events/edit", { 
            title: "Edit Event Type",
            event
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading event for edit");
    }
});

/* POST /events/:id/edit — update event type (admin) */
router.post("/:id/edit", requireAdmin, async (req, res) => {
    try {
        await Events.update(req.params.id, {
            name: req.body.EventName,
            description: req.body.EventDescription,
            type: req.body.EventType,
            recurrence_pattern: req.body.EventRecurrencePattern,
            default_capacity: Number(req.body.EventDefaultCapacity)
        });

        res.redirect(`/events/${req.params.id}`);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating event");
    }
});

/* POST /events/:id/delete — delete event and related occurrences (admin) */
router.post("/:id/delete", requireAdmin, async (req, res) => {
    try {
        await EventOccurrences.deleteByEventId(req.params.id);
        await Events.delete(req.params.id);

        res.redirect("/events");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting event");
    }
});

module.exports = router;
