// routes/eventOccurrences.js

const express = require("express");
const router = express.Router();

const { requireAdmin, requireLogin } = require("../middleware/auth");

// MODELS
const EventOccurrences = require("../models/eventOccurrences");
const Events = require("../models/events");
const Registrations = require("../models/registrations"); // We need this for the status check
const SurveyResponses = require("../models/surveys");


/* ============================================================
   LIST EVENT OCCURRENCES (With Search)
============================================================ */
// ... (All existing routes above this point remain the same) ...


/* ============================================================
   SHOW OCCURRENCE DETAILS (UPDATED FOR STATUS CHECK AND MESSAGES)
============================================================ */

router.get("/:id", requireLogin, async (req, res) => {
    try {
        const occurrenceId = req.params.id;
        const participantId = req.session.userID; // ID of the logged-in user
        
        // Retrieve and clear flash message
        const flashMessage = req.session.flashMessage;
        delete req.session.flashMessage;

        const occurrence = await EventOccurrences.getById(occurrenceId);

        if (!occurrence) {
            return res.status(404).send("Event occurrence not found");
        }

        // Fetch registration status (if user is logged in)
        let registrationStatus = null;
        if (req.session.isLoggedIn && participantId) {
            // We assume a model function exists to get status by occurrence and participant ID
            const reg = await Registrations.getByIds(occurrenceId, participantId);
            registrationStatus = reg ? reg.status : null;
        }

        res.render("eventOccurrences/show", {
            title: occurrence.event_name,
            occurrence,
            session: req.session,
            registrationStatus: registrationStatus, // CRITICAL: Pass status for button logic
            flashMessage: flashMessage // CRITICAL: Pass feedback message
        });

    } catch (err) {
        console.error("ERROR LOADING OCCURRENCE:", err);
        res.status(500).send("Error loading occurrence");
    }
});

/* ... (All other routes remain the same) ... */

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