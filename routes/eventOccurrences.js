const express = require("express");
const router = express.Router();

const { requireAdmin, requireLogin } = require("../middleware/auth");

// MODELS
const EventOccurrences = require("../models/eventOccurrences");
const Events = require("../models/events");

/* ============================================================
   LIST EVENT OCCURRENCES (With Search)
   GET /eventOccurrences
============================================================ */

router.get("/", requireLogin, async (req, res) => {
    try {
        const searchTerm = req.query.search || "";
        const occurrences = await EventOccurrences.getAll(searchTerm);

        res.render("eventOccurrences/index", {
            title: "Scheduled Events",
            occurrences,
            searchTerm,
            session: req.session
        });

    } catch (err) {
        console.error("ERROR LOADING OCCURRENCES:", err);
        res.status(500).send("Error loading occurrences");
    }
});


/* ============================================================
   NEW OCCURRENCE FORM (ADMIN)
   GET /eventOccurrences/new
============================================================ */

router.get("/new", requireAdmin, async (req, res) => {
    try {
        const events = await Events.getAll();

        res.render("eventOccurrences/new", {
            title: "Schedule New Occurrence",
            events,
            // UPDATED: Pass query params (like ?event_id=5) to the view
            query: req.query, 
            session: req.session
        });

    } catch (err) {
        console.error("ERROR LOADING NEW OCCURRENCE FORM:", err);
        res.status(500).send("Error loading form");
    }
});


/* ============================================================
   CREATE NEW OCCURRENCE (ADMIN)
   POST /eventOccurrences/new
============================================================ */

router.post("/new", requireAdmin, async (req, res) => {
    try {
        const data = {
            event_id: Number(req.body.EventID),
            starts_at: req.body.EventDateTimeStart,
            ends_at: req.body.EventDateTimeEnd,
            location: req.body.EventLocation,
            capacity: req.body.EventCapacity,
            registration_deadline: req.body.EventRegistrationDeadline
        };

        await EventOccurrences.create(data);

        // Smart Redirect: If we came from a specific event page, go back there?
        // For simplicity, we go to the main list, but you could enhance this later.
        res.redirect("/eventOccurrences");

    } catch (err) {
        console.error("ERROR CREATING OCCURRENCE:", err);
        res.status(500).send("Error creating occurrence");
    }
});


/* ============================================================
   SHOW OCCURRENCE DETAILS
   GET /eventOccurrences/:id
============================================================ */

router.get("/:id", requireLogin, async (req, res) => {
    try {
        const occurrence = await EventOccurrences.getById(req.params.id);

        if (!occurrence) {
            return res.status(404).send("Event occurrence not found");
        }

        res.render("eventOccurrences/show", {
            title: occurrence.event_name,
            occurrence,
            session: req.session
        });

    } catch (err) {
        console.error("ERROR LOADING OCCURRENCE:", err);
        res.status(500).send("Error loading occurrence");
    }
});


/* ============================================================
   EDIT OCCURRENCE FORM (ADMIN)
   GET /eventOccurrences/:id/edit
============================================================ */

router.get("/:id/edit", requireAdmin, async (req, res) => {
    try {
        const occurrence = await EventOccurrences.getById(req.params.id);
        const events = await Events.getAll();

        if (!occurrence) {
            return res.status(404).send("Event occurrence not found");
        }

        res.render("eventOccurrences/edit", {
            title: "Edit Occurrence",
            occurrence,
            events,
            session: req.session
        });

    } catch (err) {
        console.error("ERROR LOADING EDIT FORM:", err);
        res.status(500).send("Error loading edit form");
    }
});


/* ============================================================
   UPDATE OCCURRENCE (ADMIN)
   POST /eventOccurrences/:id/edit
============================================================ */

router.post("/:id/edit", requireAdmin, async (req, res) => {
    try {
        const updates = {
            event_id: Number(req.body.EventID),
            starts_at: req.body.EventDateTimeStart,
            ends_at: req.body.EventDateTimeEnd,
            location: req.body.EventLocation,
            capacity: req.body.EventCapacity,
            registration_deadline: req.body.EventRegistrationDeadline
        };

        await EventOccurrences.update(req.params.id, updates);

        res.redirect(`/eventOccurrences/${req.params.id}`);

    } catch (err) {
        console.error("ERROR UPDATING OCCURRENCE:", err);
        res.status(500).send("Error updating occurrence");
    }
});


/* ============================================================
   DELETE OCCURRENCE (ADMIN)
   POST /eventOccurrences/:id/delete
============================================================ */

router.post("/:id/delete", requireAdmin, async (req, res) => {
    try {
        await EventOccurrences.delete(req.params.id);
        res.redirect("/eventOccurrences");

    } catch (err) {
        console.error("ERROR DELETING OCCURRENCE:", err);
        res.status(500).send("Error deleting occurrence");
    }
});

module.exports = router;