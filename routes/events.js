// routes/events.js

const express = require("express");
const router = express.Router();

const { requireAdmin, requireLogin } = require("../middleware/auth");
const Events = require("../models/events"); 

/* ============================================================
   LIST EVENT TEMPLATES (LOGIN REQUIRED)
============================================================ */
router.get("/", requireLogin, async (req, res) => {
    try {
        const events = await Events.getAll();
        
        res.render("events/index", {
            title: "Event Templates",
            events
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Database Error");
    }
});


/* ============================================================
   CREATE NEW EVENT TEMPLATE (ADMIN ONLY)
============================================================ */

// Show form (No Async needed here, just rendering HTML)
router.get("/new", requireAdmin, (req, res) => {
    res.render("events/new", {
        title: "Add Event Template"
    });
});

// Submit
router.post("/new", requireAdmin, async (req, res) => {
    try {
        const newEvent = {
            // Left: DB Column | Right: HTML Input Name
            name: req.body.EventName,             // Matches form!
            type: req.body.EventType,             // Matches form!
            recurrence_pattern: req.body.EventRecurrencePattern,
            description: req.body.EventDescription,
            default_capacity: Number(req.body.EventDefaultCapacity)
        };

        // If you ran the SQL fix above, this will work perfectly!
        await Events.create(newEvent);
        
        res.redirect("/events");

    } catch (err) {
        console.error(err);
        res.status(500).send("Error creating event");
    }
});


/* ============================================================
   EDIT EVENT TEMPLATE (ADMIN ONLY)
============================================================ */

// Show edit form
router.get("/:id/edit", requireAdmin, async (req, res) => {
    try {
        const event = await Events.getById(req.params.id);
        
        if (!event) return res.status(404).send("Event template not found");

        res.render("events/edit", {
            title: "Edit Event Template",
            event
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching event");
    }
});

// Submit edits
router.post("/:id/edit", requireAdmin, async (req, res) => {
    try {
        // MAP FORM DATA TO DATABASE COLUMNS
        const updates = {
            name: req.body.EventName,
            type: req.body.EventType,
            recurrence_pattern: req.body.EventRecurrencePattern,
            description: req.body.EventDescription,
            default_capacity: Number(req.body.EventDefaultCapacity)
        };

        await Events.update(req.params.id, updates);
        res.redirect("/events");

    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating event");
    }
});


/* ============================================================
   DELETE EVENT TEMPLATE (ADMIN ONLY)
============================================================ */
router.post("/:id/delete", requireAdmin, async (req, res) => {
    try {
        await Events.delete(req.params.id);
        res.redirect("/events");
    } catch (err) {
        // Foreign Key Violation Check:
        // If this event has scheduled occurrences, Postgres will throw an error (Code 23503)
        if (err.code === '23503') {
            return res.status(400).send("Cannot delete this event because it has scheduled occurrences or history attached to it.");
        }
        console.error(err);
        res.status(500).send("Error deleting event");
    }
});


/* ============================================================
   SHOW SINGLE EVENT TEMPLATE (LOGIN REQUIRED)
============================================================ */
router.get("/:id", requireLogin, async (req, res) => {
    try {
        const event = await Events.getById(req.params.id);
        
        if (!event) return res.status(404).send("Event template not found");

        res.render("events/show", {
            title: "Event Template Details",
            event
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading event");
    }
});

module.exports = router;