const express = require("express");
const router = express.Router();

const { requireAdmin, requireLogin } = require("../middleware/auth");

// MODELS
const EventOccurrences = require("../models/eventOccurrences");
const Events = require("../models/events");
// NOTE: We will assume models for dependencies exist for the cascade
const Registrations = require("../models/registrations");
const SurveyResponses = require("../models/surveys");


/* ============================================================
   LIST EVENT OCCURRENCES (With Search)
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
   NEW OCCURRENCE FORM (ADMIN) - UPDATED FOR PRE-SELECTION
============================================================ */

router.get("/new", requireAdmin, async (req, res) => {
    try {
        // Retrieve and clear any previous errors/data from session
        const sessionErrors = req.session.errors;
        delete req.session.errors;
        const sessionFormData = req.session.formData;
        delete req.session.formData;

        const events = await Events.getAll();
        const selectedEventId = req.query.event_id;

        res.render("eventOccurrences/new", {
            title: "Schedule New Occurrence",
            events,
            query: req.query, 
            session: req.session,
            selectedEventId: selectedEventId,
            errors: sessionErrors || {}, // Pass errors back to EJS
            formData: sessionFormData || {} // Pass submitted data back
        });

    } catch (err) {
        console.error("ERROR LOADING NEW OCCURRENCE FORM:", err);
        res.status(500).send("Error loading form");
    }
});


/* ============================================================
   CREATE NEW OCCURRENCE (ADMIN) - FIXED VALIDATION & REDIRECT
   POST /eventOccurrences/new
============================================================ */

router.post("/new", requireAdmin, async (req, res) => {
    try {
        const errors = {};
        
        // --- 1. INITIAL DATA PARSING ---
        const eventId = Number(req.body.EventID);
        const capacity = Number(req.body.EventCapacity);
        const startsAt = req.body.EventDateTimeStart;
        const endsAt = req.body.EventDateTimeEnd;
        const deadline = req.body.EventRegistrationDeadline;
        
        // Convert to Date objects for comparison
        const startDate = new Date(startsAt);
        const endDate = new Date(endsAt);
        const deadlineDate = new Date(deadline);

        // --- 2. SERVER-SIDE VALIDATION ---
        if (!eventId) errors.EventID = "Event template is required.";
        if (capacity < 1 || isNaN(capacity)) errors.EventCapacity = "Capacity must be a positive number.";
        if (!startsAt) errors.StartsAt = "Start date and time are required.";

        // NEW VALIDATION 1: End Time must be after Start Time
        if (endsAt && endDate <= startDate) {
            errors.EndsAt = "End date and time must be after the start date and time.";
        }

        // NEW VALIDATION 2: Registration Deadline must be before or on the start date
        if (deadline && startsAt && deadlineDate > startDate) {
            errors.RegDeadline = "Registration deadline must be before or on the event start date.";
        }
        
        // --- 3. HANDLE VALIDATION FAILURE ---
        if (Object.keys(errors).length > 0) {
            req.session.errors = errors;
            req.session.formData = req.body;
            // Redirect back to the GET /new route to display errors/data
            return res.redirect("/eventOccurrences/new"); 
        }
        
        // --- 4. PROCESS DATA (if valid) ---
        const data = {
            event_id: eventId,
            starts_at: startsAt,
            ends_at: endsAt,
            location: req.body.EventLocation,
            capacity: capacity,
            registration_deadline: deadline
        };

        await EventOccurrences.create(data);

        // --- 5. REDIRECT ON SUCCESS ---
        // Redirect back to the parent Event Template detail page
        res.redirect(`/events/${eventId}`); 

    } catch (err) {
        console.error("ERROR CREATING OCCURRENCE:", err);
        res.status(500).send("Error creating occurrence");
    }
});


/* ============================================================
   SHOW OCCURRENCE DETAILS
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
   EDIT OCCURRENCE FORM (ADMIN) - FIX INITIAL LOAD CRASH
============================================================ */

router.get("/:id/edit", requireAdmin, async (req, res) => {
    try {
        // Retrieve and clear any previous errors/data from session
        const sessionErrors = req.session.errors;
        delete req.session.errors;
        const sessionFormData = req.session.formData;
        delete req.session.formData;
        
        const occurrence = await EventOccurrences.getById(req.params.id);
        const events = await Events.getAll();

        if (!occurrence) {
            return res.status(404).send("Event occurrence not found");
        }

        res.render("eventOccurrences/edit", {
            title: "Edit Occurrence",
            occurrence,
            events,
            session: req.session,
            // FIX: Pass empty defaults to prevent EJS crash on initial load
            errors: sessionErrors || {}, 
            formData: sessionFormData || {}
        });

    } catch (err) {
        console.error("ERROR LOADING EDIT FORM:", err);
        res.status(500).send("Error loading edit form");
    }
});


/* ============================================================
   UPDATE OCCURRENCE (ADMIN)
============================================================ */

router.post("/:id/edit", requireAdmin, async (req, res) => {
    try {
        const occurrenceId = req.params.id;
        const errors = {};
        
        // --- 1. INITIAL DATA PARSING ---
        const eventId = Number(req.body.EventID);
        const capacity = Number(req.body.EventCapacity);
        const startsAt = req.body.EventDateTimeStart;
        const endsAt = req.body.EventDateTimeEnd;
        const deadline = req.body.EventRegistrationDeadline;
        
        // Convert to Date objects for comparison
        const startDate = new Date(startsAt);
        const endDate = new Date(endsAt);
        const deadlineDate = new Date(deadline);

        // --- 2. SERVER-SIDE VALIDATION ---
        if (!eventId) errors.EventID = "Event template is required.";
        if (capacity < 1 || isNaN(capacity)) errors.EventCapacity = "Capacity must be a positive number.";
        if (!startsAt) errors.StartsAt = "Start date and time are required.";

        // NEW VALIDATION 1: End Time must be after Start Time
        if (endsAt && endDate <= startDate) {
            errors.EndsAt = "End date and time must be after the start date and time.";
        }

        // NEW VALIDATION 2: Registration Deadline must be before or on the start date
        if (deadline && startsAt && deadlineDate > startDate) {
            errors.RegDeadline = "Registration deadline must be before or on the event start date.";
        }

        // --- 3. HANDLE VALIDATION FAILURE ---
        if (Object.keys(errors).length > 0) {
            req.session.errors = errors;
            req.session.formData = req.body;
            // Redirect back to the GET /edit route to display errors/data
            return res.redirect(`/eventOccurrences/${occurrenceId}/edit`); 
        }

        const updates = {
            event_id: eventId,
            starts_at: startsAt,
            ends_at: endsAt,
            location: req.body.EventLocation,
            capacity: capacity,
            registration_deadline: deadline
        };

        await EventOccurrences.update(req.params.id, updates);

        res.redirect(`/events/${eventId}`); // FIX: Redirect back to the parent Event Template detail page

    } catch (err) {
        console.error("ERROR UPDATING OCCURRENCE:", err);
        res.status(500).send("Error updating occurrence");
    }
});


/* ============================================================
   DELETE OCCURRENCE (ADMIN) - UPDATED FOR CASCADE LOGIC
============================================================ */

router.post("/:id/delete", requireAdmin, async (req, res) => {
    try {
        // Step 0: Find the parent Event ID before deleting the occurrence record
        const occurrenceToDelete = await EventOccurrences.getById(req.params.id);
        const parentEventId = occurrenceToDelete ? occurrenceToDelete.event_id : null;
        
        // Step 1: Manually delete all downstream dependencies (Registrations and Surveys)
        await Registrations.deleteByOccurrenceId(req.params.id); 
        await SurveyResponses.deleteByOccurrenceId(req.params.id); 
        
        // Step 2: Delete the main occurrence record
        await EventOccurrences.delete(req.params.id);
        
        // Step 3: Redirect back to the parent Event Template detail page
        if (parentEventId) {
            return res.redirect(`/events/${parentEventId}`);
        } else {
            // Fallback: Go back to the general occurrence list
            return res.redirect("/eventOccurrences");
        }
    } catch (err) {
        console.error("ERROR DELETING OCCURRENCE:", err);
        res.status(500).send("Error deleting occurrence");
    }
});

module.exports = router;