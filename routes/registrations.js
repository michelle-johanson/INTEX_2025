// routes/registrations.js

const express = require("express");
const router = express.Router();

const { requireAdmin, requireLogin } = require("../middleware/auth");

const Registrations = require("../models/registrations");
const Participants = require("../models/participants");
const EventOccurrences = require("../models/eventOccurrences");

/* ============================================================
   MAIN INDEX ROUTE (SPLIT LOGIC)
============================================================ */
router.get("/", requireLogin, async (req, res) => {
    try {
        const role = (req.session.access_level || "").toLowerCase();

        // SCENARIO 1: MANAGER LOGGED IN
        // Show a Directory of EVENTS (Occurrences)
        if (role === "manager" || role === "admin") {
            const occurrences = await EventOccurrences.getAll();
            
            return res.render("registrations/manager_index", {
                title: "Manage Registrations",
                occurrences
            });
        }

        // SCENARIO 2: PARTICIPANT LOGGED IN
        // Redirect to their profile which has the link to their registrations
        res.redirect(`/participants/${req.session.userID}`);

    } catch (err) {
        console.error(err);
        res.status(500).send("Database Error");
    }
});

/* ============================================================
   NEW ROUTE: MANAGER/PARTICIPANT VIEW OF ONE PARTICIPANT'S REGISTRATIONS
   URL: /registrations/participant/5 (from Profile Show Page)
============================================================ */
router.get("/participant/:id", requireLogin, async (req, res) => { 
    try {
        const requestedParticipantId = req.params.id;
        const loggedInUserId = req.session.userID;
        
        // 1. Authorization Check
        const role = (req.session.access_level || "").toLowerCase();
        const isManager = role === 'manager' || role === 'admin';
        const isOwner = String(loggedInUserId) === String(requestedParticipantId);
        
        if (!isManager && !isOwner) {
            return res.status(403).send("Unauthorized Access: You can only view your own registrations.");
        }

        // 2. Fetch all registrations for this specific participant
        const participantRegistrations = await Registrations.getByParticipant(requestedParticipantId);

        // 3. Fetch participant details for the title
        const participant = await Participants.getById(requestedParticipantId);

        if (!participant) return res.status(404).send("Participant not found");

        res.render("registrations/index", {
            title: `${participant.first_name}'s Event Registrations`,
            registrations: participantRegistrations,
            contextName: `${participant.first_name}'s`,
            // Pass participant ID for the 'Add Registration' button functionality
            targetParticipantId: requestedParticipantId,
            isManager: isManager 
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading participant registrations");
    }
});


/* ============================================================
   MANAGER DRILL-DOWN: View Registrants for ONE Event
   URL: /registrations/event/5
============================================================ */
router.get("/event/:id", requireAdmin, async (req, res) => {
    try {
        const occurrenceId = req.params.id;

        // Fetch all registrations for this specific event
        const eventRegistrations = await Registrations.getByOccurrence(occurrenceId);
        
        // Fetch event details for the title and parent ID (event_id)
        const occurrence = await EventOccurrences.getById(occurrenceId);

        res.render("registrations/index", {
            title: `Registrations for ${occurrence.event_name}`,
            registrations: eventRegistrations,
            contextName: occurrence.event_name,
            // CRITICAL FIX: Pass parent IDs to enable the back button
            parentOccurrenceId: occurrenceId, 
            parentEventId: occurrence.event_id 
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading event registrations");
    }
});


/* ============================================================
   NEW REGISTRATION (ADMIN ONLY) - CAPTURES SOURCE ID
============================================================ */
router.get("/new", requireAdmin, async (req, res) => {
    try {
        const participants = await Participants.getAll();
        const occurrences = await EventOccurrences.getAll();
        
        // FIX: Capture source IDs from URL query (for pre-selection and redirect)
        const sourceEventId = req.query.event_id;
        const sourceParticipantId = req.query.participant_id;

        res.render("registrations/new", {
            title: "New Registration",
            participants,
            occurrences,
            sourceEventId: sourceEventId,
            sourceParticipantId: sourceParticipantId
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading form");
    }
});

router.post("/new", requireAdmin, async (req, res) => {
    try {
        const newRegistration = {
            event_occurrence_id: Number(req.body.EventOccurrenceID),
            participant_id: Number(req.body.ParticipantID),
            status: req.body.RegistrationStatus,
            attended: req.body.RegistrationAttendedFlag === "on",
            check_in_time: req.body.RegistrationCheckInTime || null,
            created_at: req.body.RegistrationCreatedAt || new Date(),
            
            // Capture source IDs from hidden fields (passed from form)
            sourceEventId: req.body.SourceEventId,
            sourceParticipantId: req.body.SourceParticipantId
        };

        await Registrations.create(newRegistration);
        
        // FIX: Determine redirect based on source of navigation
        let redirectPath;
        if (newRegistration.sourceParticipantId) {
            // Came from a specific participant's profile (View Registrations)
            redirectPath = `/registrations/participant/${newRegistration.sourceParticipantId}`;
        } else if (newRegistration.sourceEventId) {
            // Came from a specific event's page (View Registrants)
            redirectPath = `/events/${newRegistration.sourceEventId}`;
        } else {
            // Default: Redirect back to the event registrants list
            redirectPath = `/registrations/event/${newRegistration.event_occurrence_id}`;
        }
        
        res.redirect(redirectPath);

    } catch (err) {
        console.error(err);
        res.status(500).send("Error creating registration");
    }
});


/* ============================================================
   EDIT REGISTRATION (ADMIN ONLY)
============================================================ */
router.get("/:oid/:pid/edit", requireAdmin, async (req, res) => {
    try {
        const registration = await Registrations.getByIds(req.params.oid, req.params.pid);
        const participants = await Participants.getAll();
        const occurrences = await EventOccurrences.getAll();

        if (!registration) return res.status(404).send("Registration not found");

        res.render("registrations/edit", {
            title: "Edit Registration",
            registration,
            participants,
            occurrences
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading edit form");
    }
});

router.post("/:oid/:pid/edit", requireAdmin, async (req, res) => {
    try {
        const updates = {
            status: req.body.RegistrationStatus,
            attended: req.body.RegistrationAttendedFlag === "on",
            check_in_time: req.body.RegistrationCheckInTime || null,
            created_at: req.body.RegistrationCreatedAt
        };

        await Registrations.update(req.params.oid, req.params.pid, updates);
        
        // Redirect back to that event's list
        res.redirect(`/registrations/event/${req.params.oid}`);

    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating registration");
    }
});


/* ============================================================
   DELETE REGISTRATION (ADMIN ONLY)
============================================================ */
router.post("/:oid/:pid/delete", requireAdmin, async (req, res) => {
    try {
        await Registrations.delete(req.params.oid, req.params.pid);
        
        // Redirect back to that event's list
        res.redirect(`/registrations/event/${req.params.oid}`);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting registration");
    }
});


/* ============================================================
   SHOW SINGLE REGISTRATION (LOGIN REQUIRED)
============================================================ */
router.get("/:oid/:pid", requireLogin, async (req, res) => {
    try {
        const registration = await Registrations.getByIds(req.params.oid, req.params.pid);

        if (!registration) return res.status(404).send("Registration not found");

        // SECURITY CHECK
        const role = (req.session.access_level || "").toLowerCase();
        const isAuthorized = (role === 'manager' || role === 'admin') || 
                             (String(req.session.userID) === String(registration.participant_id));

        if (!isAuthorized) {
             return res.status(403).send("Unauthorized Access");
        }

        res.render("registrations/show", {
            title: "Registration Details",
            registration
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading details");
    }
});

// CRITICAL: Export the router function, NOT an object
module.exports = router;