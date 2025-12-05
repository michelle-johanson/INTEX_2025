const express = require("express");
const router = express.Router();

const { requireAdmin, requireLogin } = require("../middleware/auth");

// MODELS
const EventOccurrences = require("../models/eventOccurrences");
const Events = require("../models/events");
const Registrations = require("../models/registrations"); 
const SurveyResponses = require("../models/surveys");


/* ============================================================
   1. LIST ROUTE (Index)
============================================================ */
router.get("/", requireLogin, async (req, res) => {
    try {
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
   2. CREATE ROUTES (MUST BE BEFORE /:id)
============================================================ */

// GET Form to Create New Occurrence
router.get("/new", requireAdmin, async (req, res) => {
    try {
        const events = await Events.getAll(); 
        const preSelectedEventId = req.query.event_id;

        res.render("eventOccurrences/new", {
            title: "Schedule New Occurrence",
            events: events,
            selectedEventId: preSelectedEventId || "",
            errors: {},
            formData: {}
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading form");
    }
});

// POST Create New Occurrence
router.post("/new", requireAdmin, async (req, res) => {
    try {
        // 1. Map Form Fields to DB Schema
        const dbData = {
            event_id: req.body.EventID,
            starts_at: req.body.EventDateTimeStart,
            ends_at: req.body.EventDateTimeEnd,
            location: req.body.EventLocation,
            capacity: req.body.EventCapacity,
            registration_deadline: req.body.EventRegistrationDeadline
        };

        // --- VALIDATION LOGIC ---
        const errors = {};
        const start = new Date(dbData.starts_at);
        const end = new Date(dbData.ends_at);
        
        const startDateString = dbData.starts_at ? dbData.starts_at.split('T')[0] : "";
        const deadlineString = dbData.registration_deadline || "";

        if (dbData.ends_at && start >= end) {
            errors.EndsAt = "End time must be after the start time.";
        }
        
        if (deadlineString && startDateString && deadlineString > startDateString) {
            errors.RegistrationDeadline = "Registration deadline cannot be after the event start date.";
        }

        if (Object.keys(errors).length > 0) {
            const events = await Events.getAll();
            
            // For 'new' view, we use PascalCase keys because new.ejs expects them
            const formDataForView = {
                EventID: req.body.EventID,
                EventLocation: req.body.EventLocation,
                EventCapacity: req.body.EventCapacity,
                EventDateTimeStart: "", 
                EventDateTimeEnd: "",
                EventRegistrationDeadline: ""
            };

            return res.render("eventOccurrences/new", {
                title: "Schedule New Occurrence",
                events: events,
                selectedEventId: req.body.EventID,
                errors: errors,
                formData: formDataForView
            });
        }
        // ------------------------

        await EventOccurrences.create(dbData);

        res.redirect(`/events/${dbData.event_id}`);

    } catch (err) {
        console.error("Error creating occurrence:", err);
        res.status(500).send("Error creating occurrence");
    }
});


/* ============================================================
   3. SPECIFIC ID ROUTES (Show, Edit, Delete)
   (These must come AFTER /new)
============================================================ */

// SHOW OCCURRENCE DETAILS
router.get("/:id", requireLogin, async (req, res) => {
    try {
        const occurrenceId = req.params.id;
        const participantId = req.session.userID; 
        
        const flashMessage = req.session.flashMessage;
        if (req.session.flashMessage) delete req.session.flashMessage;

        const occurrence = await EventOccurrences.getById(occurrenceId);

        if (!occurrence) {
            return res.status(404).send("Event occurrence not found");
        }

        let registrationStatus = null;
        let hasAttended = false;
        let hasSubmittedSurvey = false;

        if (req.session.isLoggedIn && participantId) {
            const reg = await Registrations.getByIds(occurrenceId, participantId);
            registrationStatus = reg ? reg.status : null;
            
            hasAttended = await Registrations.checkIfAttended(occurrenceId, participantId);
            hasSubmittedSurvey = await SurveyResponses.checkIfSubmitted(occurrenceId, participantId);
        }
        
        const showSurveyButton = hasAttended && !hasSubmittedSurvey;

        res.render("eventOccurrences/show", {
            title: occurrence.event_name,
            occurrence,
            session: req.session,
            registrationStatus: registrationStatus,
            flashMessage: flashMessage,
            hasAttended: hasAttended, 
            hasSubmittedSurvey: hasSubmittedSurvey,
            showSurveyButton: showSurveyButton 
        });

    } catch (err) {
        console.error("ERROR LOADING OCCURRENCE:", err);
        res.status(500).send("Error loading occurrence");
    }
});

/* ============================================================
   EDIT ROUTES
============================================================ */

// GET Edit Form
router.get("/:id/edit", requireAdmin, async (req, res) => {
    try {
        const occurrence = await EventOccurrences.getById(req.params.id);
        const events = await Events.getAll();

        if (!occurrence) {
            return res.status(404).send("Occurrence not found");
        }

        // FIX: Pass empty formData. 
        // The View logic: `const data = formData ... ? formData : occurrence;`
        // By sending empty formData, the View will use 'occurrence' (the DB record),
        // which has the correct keys (starts_at, location) populated.
        res.render("eventOccurrences/edit", {
            title: "Edit Occurrence",
            occurrence,
            events,
            errors: {},
            formData: {} 
        });
    } catch (err) {
        console.error("Error loading edit form:", err);
        res.status(500).send("Error loading edit form");
    }
});

// POST Update Occurrence
router.post("/:id/edit", requireAdmin, async (req, res) => {
    try {
        const dbData = {
            event_id: req.body.EventID,
            starts_at: req.body.EventDateTimeStart,
            ends_at: req.body.EventDateTimeEnd,
            location: req.body.EventLocation,
            capacity: req.body.EventCapacity,
            registration_deadline: req.body.EventRegistrationDeadline
        };

        // --- VALIDATION LOGIC ---
        const errors = {};
        const start = new Date(dbData.starts_at);
        const end = new Date(dbData.ends_at);
        
        const startDateString = dbData.starts_at ? dbData.starts_at.split('T')[0] : "";
        const deadlineString = dbData.registration_deadline || "";

        if (dbData.ends_at && start >= end) {
            errors.EndsAt = "End time must be after the start time.";
        }
        
        if (deadlineString && startDateString && deadlineString > startDateString) {
            errors.RegistrationDeadline = "Registration deadline cannot be after the event start date.";
        }

        if (Object.keys(errors).length > 0) {
            const events = await Events.getAll();
            const originalOccurrence = await EventOccurrences.getById(req.params.id);
            
            // FIX: Map the inputs back to snake_case keys (location, capacity, etc.)
            // The Edit View expects these keys to match the 'occurrence' object structure.
            const formDataForView = {
                event_id: req.body.EventID,
                location: req.body.EventLocation,
                capacity: req.body.EventCapacity,
                // Dates cleared as requested on error
                starts_at: "", 
                ends_at: "",
                registration_deadline: ""
            };

            return res.render("eventOccurrences/edit", {
                title: "Edit Occurrence",
                occurrence: originalOccurrence,
                events: events,
                errors: errors,
                formData: formDataForView 
            });
        }
        // ------------------------

        await EventOccurrences.update(req.params.id, dbData);

        res.redirect(`/eventOccurrences/${req.params.id}`);

    } catch (err) {
        console.error("Error updating occurrence:", err);
        res.status(500).send("Error updating occurrence");
    }
});

// DELETE OCCURRENCE
router.post("/:id/delete", requireAdmin, async (req, res) => {
    try {
        const occurrenceToDelete = await EventOccurrences.getById(req.params.id);
        const parentEventId = occurrenceToDelete ? occurrenceToDelete.event_id : null;
        
        await Registrations.deleteByOccurrenceId(req.params.id); 
        await SurveyResponses.deleteByOccurrenceId(req.params.id); 
        
        await EventOccurrences.delete(req.params.id);
        
        if (parentEventId) {
            return res.redirect(`/events/${parentEventId}`);
        } else {
            return res.redirect("/eventOccurrences");
        }
    } catch (err) {
        console.error("ERROR DELETING OCCURRENCE:", err);
        res.status(500).send("Error deleting occurrence");
    }
});

module.exports = router;