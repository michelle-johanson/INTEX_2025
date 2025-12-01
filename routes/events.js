// routes/events.js

const express = require("express");
const router = express.Router();

const { requireAdmin, requireLogin } = require("../middleware/auth");
const Events = require("../models/fakeEvents");

/* ============================================================
    LIST EVENTS  (LOGIN REQUIRED)
============================================================ */
router.get("/", requireLogin, (req, res) => {
    const events = Events.getAll();
    res.render("events/index", {
        title: "Events",
        events
    });
});


/* ============================================================
    CREATE EVENT (ADMIN ONLY)
============================================================ */

// Show form
router.get("/new", requireAdmin, (req, res) => {
    res.render("events/new", { title: "Add Event" });
});

// Handle submit
router.post("/new", requireAdmin, (req, res) => {
    Events.add({
        name: req.body.name,
        date: req.body.date,
        location: req.body.location,
        event_type: req.body.event_type
    });

    res.redirect("/events");
});


/* ============================================================
    EDIT EVENT (ADMIN ONLY)
============================================================ */

// Show form
router.get("/:id/edit", requireAdmin, (req, res) => {
    const event = Events.getById(req.params.id);

    if (!event) return res.status(404).send("Event not found");

    res.render("events/edit", {
        title: "Edit Event",
        event
    });
});

// Handle submit
router.post("/:id/edit", requireAdmin, (req, res) => {
    Events.update(req.params.id, {
        name: req.body.name,
        date: req.body.date,
        location: req.body.location,
        event_type: req.body.event_type
    });

    res.redirect("/events");
});


/* ============================================================
    DELETE EVENT (ADMIN ONLY)
============================================================ */
router.post("/:id/delete", requireAdmin, (req, res) => {
    Events.delete(req.params.id);
    res.redirect("/events");
});


/* ============================================================
    SHOW ONE EVENT (LOGIN REQUIRED)
============================================================ */
router.get("/:id", requireLogin, (req, res) => {
    const event = Events.getById(req.params.id);

    if (!event) return res.status(404).send("Event not found");

    res.render("events/show", {
        title: "Event Details",
        event
    });
});

module.exports = router;
