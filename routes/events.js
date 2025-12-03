const express = require("express");
const router = express.Router();
const { requireAdmin, requireLogin } = require("../middleware/auth");

// MODELS
const Events = require("../models/events");
const EventOccurrences = require("../models/eventOccurrences");

/* ============================================================
   LIST ALL EVENT TEMPLATES
============================================================ */

router.get("/", requireLogin, async (req, res) => {
    try {
        const events = await Events.getAll();
        res.render("events/index", {
            title: "Event Types",
            events
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
    res.render("events/new", {
        title: "Create New Event Type"
    });
});

router.post("/new", requireAdmin, async (req, res) => {
    try {
        await Events.create({
            name: req.body.EventName,
            description: req.body.EventDescription,
            event_type: req.body.EventType
        });

        res.redirect("/events");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error creating event");
    }
});


/* ============================================================
   VIEW SINGLE EVENT TYPE
============================================================ */

router.get("/:id", requireLogin, async (req, res) => {
    try {
        const event = await Events.getById(req.params.id);

        if (!event) return res.status(404).send("Event not found");

        const occurrences = await Events.getUpcomingOccurrences(req.params.id);

        res.render("events/show", {
            title: event.name,
            event,
            occurrences
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

        res.render("events/edit", {
            title: "Edit Event Type",
            event
        });
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
            event_type: req.body.EventType
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
        // Foreign key protection
        if (err.code === "23503") {
            return res.status(400).send(
                "Cannot delete this event because it has scheduled occurrences."
            );
        }

        console.error(err);
        res.status(500).send("Error deleting event");
    }
});

module.exports = router;
