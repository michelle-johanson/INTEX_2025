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
        if (role === "manager" || role === "admin") {
            const occurrences = await EventOccurrences.getAll();
            
            return res.render("registrations/manager_index", {
                title: "Manage Registrations",
                occurrences
            });
        }

        // SCENARIO 2: PARTICIPANT LOGGED IN
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

        const eventRegistrations = await Registrations.getByOccurrence(occurrenceId);
        const occurrence = await EventOccurrences.getById(occurrenceId);

        res.render("registrations/index", {
            title: `Registrations for ${occurrence.event_name}`,
            registrations: eventRegistrations,
            contextName: occurrence.event_name,
            parentOccurrenceId: occurrenceId, 
            parentEventId: occurrence.event_id 
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading event registrations");
    }
});

/* ============================================================
   SELF-SERVICE REGISTRATION (PARTICIPANT)
   URL: POST /registrations/register/:id
============================================================ */
router.post("/register/:id", requireLogin, async (req, res) => {
    try {
        const eventOccurrenceId = req.params.id;
        const participantId = req.session.userID; // Get ID from session

        const newRegistration = {
            event_occurrence_id: eventOccurrenceId,
            participant_id: participantId,
            status: 'Registered', // Default status
            attended: false,
            created_at: new Date()
        };

        // Create the registration
        await Registrations.create(newRegistration);

        // Fetch occurrence details to get the parent event_id for redirection
        const occurrence = await EventOccurrences.getById(eventOccurrenceId);

        // Redirect back to the event page
        if (occurrence && occurrence.event_id) {
            res.redirect(`/events/${occurrence.event_id}`);
        } else {
            // Fallback if event_id lookup fails
            res.redirect(`/participants/${participantId}`);
        }

    } catch (err) {
        // Handle duplicate key error (already registered)
        if (err.code === '23505') { 
             try {
                const occurrence = await EventOccurrences.getById(req.params.id);
                if (occurrence && occurrence.event_id) {
                    return res.redirect(`/events/${occurrence.event_id}`);
                }
             } catch (lookupErr) {
                 console.error("Error looking up event during error handling:", lookupErr);
             }
             return res.redirect(`/participants/${req.session.userID}`);
        }
        console.error("Self-registration error:", err);
        res.status(500).send("Error registering for event");
    }
});


/* ============================================================
   NEW REGISTRATION (ADMIN ONLY) - CAPTURES SOURCE ID
============================================================ */
router.get("/new", requireAdmin, async (req, res) => {
    try {
        const participants = await Participants.getAll();
        const occurrences = await EventOccurrences.getAll();
        
        // FIX: We must pass req.query to the view so it can see 'event_occurrence_id'
        res.render("registrations/new", {
            title: "New Registration",
            participants,
            occurrences,
            query: req.query // <--- This enables the dropdown pre-selection logic
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading form");
    }
});

router.post("/new", requireAdmin, async (req, res) => {
    try {
        // 1. Extract Redirection Helpers (DO NOT SEND TO DB)
        const sourceEventId = req.body.SourceEventId;
        const sourceParticipantId = req.body.SourceParticipantId;

        // 2. Create Clean DB Object (Only columns that exist in the table)
        const dbRegistration = {
            event_occurrence_id: Number(req.body.EventOccurrenceID),
            participant_id: Number(req.body.ParticipantID),
            status: req.body.RegistrationStatus,
            attended: req.body.RegistrationAttendedFlag === "on",
            check_in_time: req.body.RegistrationCheckInTime || null,
            created_at: req.body.RegistrationCreatedAt || new Date()
        };

        // 3. Save to Database
        await Registrations.create(dbRegistration);
        
        // 4. Handle Redirection using extracted variables
        let redirectPath;
        if (sourceParticipantId) {
            redirectPath = `/registrations/participant/${sourceParticipantId}`;
        } else if (sourceEventId) {
            redirectPath = `/events/${sourceEventId}`;
        } else {
            // If we registered directly for an occurrence, go back to that occurrence's list
            redirectPath = `/registrations/event/${dbRegistration.event_occurrence_id}`;
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

module.exports = router;