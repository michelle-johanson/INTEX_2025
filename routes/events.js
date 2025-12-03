const express = require("express");
const router = express.Router();
const { requireAdmin, requireLogin } = require("../middleware/auth");

// MODELS
const Events = require("../models/events");
const EventOccurrences = require("../models/eventOccurrences");

/* ============================================================
   LIST ALL EVENT TEMPLATES (Level 1)
============================================================ */
router.get("/", requireLogin, async (req, res) => {
    try {
        const searchTerm = req.query.search || "";
        const events = await Events.getAll(searchTerm);
        
        res.render("events/index", {
            title: "Event Types",
            events,
            searchTerm,
            session: req.session // <--- ADD THIS so the EJS doesn't crash
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading events");
    }
});

/* ============================================================
   NEW EVENT TEMPLATE (ADMIN)
============================================================ */
router.get("/new", requireAdmin, (req, res) => {
    res.render("events/new", { title: "Create New Event Type" });
});

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

/* ============================================================
   VIEW SINGLE EVENT & OCCURRENCES (Level 2)
/* ============================================================
   VIEW SINGLE EVENT & OCCURRENCES (Level 2)
============================================================ */
router.get("/:id", requireLogin, async (req, res) => {
    try {
        // 1. Get Event Details
        const event = await Events.getById(req.params.id);
        if (!event) return res.status(404).send("Event not found");

        // 2. Get Occurrences (with Search)
        const searchTerm = req.query.search || "";
        const occurrences = await EventOccurrences.getByEventId(req.params.id, searchTerm);

        res.render("events/show", {
            title: event.name,
            event,
            occurrences,
            searchTerm,
            session: req.session // <--- YOU MUST ADD THIS LINE
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading event");
    }
});

/* ============================================================
   EDIT EVENT TEMPLATE (ADMIN)
============================================================ */
router.get("/:id/edit", requireAdmin, async (req, res) => {
    try {
        const event = await Events.getById(req.params.id);
        if (!event) return res.status(404).send("Event not found");
        res.render("events/edit", { title: "Edit Event Type", event });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading event for edit");
    }
});

router.post("/:id/edit", requireAdmin, async (req, res) => {
    try {
        await Events.update(req.params.id, {
            name: req.body.EventName,
            description: req.body.EventDescription,
            type: req.body.EventType, 
            recurrence_pattern: req.body.EventRecurrencePattern,
            default_capacity: Number(req.body.EventDefaultCapacity)
        });
        res.redirect("/events/" + req.params.id);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating event");
    }
});

/* ============================================================
   DELETE EVENT TEMPLATE (ADMIN)
============================================================ */
router.post("/:id/delete", requireAdmin, async (req, res) => {
    try {
        await Events.delete(req.params.id);
        res.redirect("/events");
    } catch (err) {
        if (err.code === "23503") return res.status(400).send("Cannot delete this event because it has scheduled occurrences.");
        console.error(err);
        res.status(500).send("Error deleting event");
    }
});

module.exports = router;