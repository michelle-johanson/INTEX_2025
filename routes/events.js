// routes/events.js (Event Templates)

const express = require("express");
const router = express.Router();

const { requireAdmin, requireLogin } = require("../middleware/auth");
const Events = require("../models/events");   // NEW ERD MODEL

/* ============================================================
   LIST EVENT TEMPLATES (LOGIN REQUIRED)
============================================================ */
router.get("/", requireLogin, (req, res) => {
    const events = Events.getAll();

    res.render("events/index", {
        title: "Event Templates",
        events
    });
});


/* ============================================================
   CREATE NEW EVENT TEMPLATE (ADMIN ONLY)
============================================================ */

// Show form
router.get("/new", requireAdmin, (req, res) => {
    res.render("events/new", {
        title: "Add Event Template"
    });
});

// Submit
router.post("/new", requireAdmin, (req, res) => {
    Events.create({
        EventName: req.body.EventName,
        EventType: req.body.EventType,
        EventRecurrencePattern: req.body.EventRecurrencePattern,
        EventDescription: req.body.EventDescription,
        EventDefaultCapacity: Number(req.body.EventDefaultCapacity)
    });

    res.redirect("/events");
});


/* ============================================================
   EDIT EVENT TEMPLATE (ADMIN ONLY)
============================================================ */

// Show edit form
router.get("/:id/edit", requireAdmin, (req, res) => {
    const event = Events.getById(req.params.id);
    if (!event) return res.status(404).send("Event template not found");

    res.render("events/edit", {
        title: "Edit Event Template",
        event
    });
});

// Submit edits
router.post("/:id/edit", requireAdmin, (req, res) => {
    Events.update(req.params.id, {
        EventName: req.body.EventName,
        EventType: req.body.EventType,
        EventRecurrencePattern: req.body.EventRecurrencePattern,
        EventDescription: req.body.EventDescription,
        EventDefaultCapacity: Number(req.body.EventDefaultCapacity)
    });

    res.redirect("/events");
});


/* ============================================================
   DELETE EVENT TEMPLATE (ADMIN ONLY)
============================================================ */
router.post("/:id/delete", requireAdmin, (req, res) => {
    Events.delete(req.params.id);
    res.redirect("/events");
});


/* ============================================================
   SHOW SINGLE EVENT TEMPLATE (LOGIN REQUIRED)
============================================================ */
router.get("/:id", requireLogin, (req, res) => {
    const event = Events.getById(req.params.id);
    if (!event) return res.status(404).send("Event template not found");

    res.render("events/show", {
        title: "Event Template Details",
        event
    });
});

module.exports = router;
