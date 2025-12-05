const express = require("express");
const router = express.Router();

const { requireAdmin, requireLogin } = require("../middleware/auth");

const Registrations = require("../models/registrations");
const Participants = require("../models/participants");
const EventOccurrences = require("../models/eventOccurrences");
const Surveys = require("../models/surveys"); 

/* ============================================================
   MAIN INDEX ROUTE
============================================================ */
router.get("/", requireLogin, async (req, res) => {
    try {
        const role = (req.session.access_level || "").toLowerCase();
        if (role === "manager" || role === "admin") {
            const occurrences = await EventOccurrences.getAll();
            return res.render("registrations/manager_index", {
                title: "Manage Registrations",
                occurrences
            });
        }
        res.redirect(`/participants/${req.session.userID}`);
    } catch (err) {
        console.error(err);
        res.status(500).send("Database Error");
    }
});

/* ============================================================
   PARTICIPANT VIEW
============================================================ */
router.get("/participant/:id", requireLogin, async (req, res) => { 
    try {
        const requestedParticipantId = req.params.id;
        const loggedInUserId = req.session.userID;
        
        const role = (req.session.access_level || "").toLowerCase();
        const isManager = role === 'manager' || role === 'admin';
        const isOwner = String(loggedInUserId) === String(requestedParticipantId);
        
        if (!isManager && !isOwner) {
            return res.status(403).send("Unauthorized Access");
        }

        const participantRegistrations = await Registrations.getByParticipant(requestedParticipantId);
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
   MANAGER EVENT VIEW
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
   SELF-SERVICE REGISTRATION
============================================================ */
router.post("/register/:id", requireLogin, async (req, res) => {
    try {
        const eventOccurrenceId = req.params.id;
        const participantId = req.session.userID;

        const newRegistration = {
            event_occurrence_id: eventOccurrenceId,
            participant_id: participantId,
            status: 'Registered',
            attended: false,
            created_at: new Date()
        };

        await Registrations.create(newRegistration);

        // Redirect Logic
        const occurrence = await EventOccurrences.getById(eventOccurrenceId);
        if (occurrence && occurrence.event_id) {
            res.redirect(`/events/${occurrence.event_id}`);
        } else {
            res.redirect(`/participants/${participantId}`);
        }

    } catch (err) {
        if (err.code === '23505') { 
             try {
                const occurrence = await EventOccurrences.getById(req.params.id);
                if (occurrence && occurrence.event_id) {
                    return res.redirect(`/events/${occurrence.event_id}`);
                }
             } catch (lookupErr) {}
             return res.redirect(`/participants/${req.session.userID}`);
        }
        console.error("Self-registration error:", err);
        res.status(500).send("Error registering for event");
    }
});

/* ============================================================
   SELF-SERVICE UNREGISTRATION - UPDATED FOR REDIRECT
============================================================ */
router.post("/unregister/:id", requireLogin, async (req, res) => {
    try {
        const eventOccurrenceId = req.params.id;
        const participantId = req.session.userID;

        await Registrations.delete(eventOccurrenceId, participantId);

        // FIX: Check if a specific return path was sent
        if (req.body.returnTo) {
            return res.redirect(req.body.returnTo);
        }

        // Default fallback behavior
        const occurrence = await EventOccurrences.getById(eventOccurrenceId);
        if (occurrence && occurrence.event_id) {
            res.redirect(`/events/${occurrence.event_id}`);
        } else {
            res.redirect(`/participants/${participantId}`);
        }

    } catch (err) {
        console.error("Self-unregister error:", err);
        res.status(500).send("Error unregistering from event");
    }
});

/* ============================================================
   ADMIN ACTIONS (New, Edit, Delete)
============================================================ */
router.get("/new", requireAdmin, async (req, res) => {
    try {
        const participants = await Participants.getAll();
        const occurrences = await EventOccurrences.getAll();
        res.render("registrations/new", {
            title: "New Registration",
            participants,
            occurrences,
            query: req.query 
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading form");
    }
});

router.post("/new", requireAdmin, async (req, res) => {
    try {
        const sourceEventId = req.body.SourceEventId;
        const sourceParticipantId = req.body.SourceParticipantId;

        const dbRegistration = {
            event_occurrence_id: Number(req.body.EventOccurrenceID),
            participant_id: Number(req.body.ParticipantID),
            status: req.body.RegistrationStatus,
            attended: req.body.RegistrationAttendedFlag === "on",
            check_in_time: req.body.RegistrationCheckInTime || null,
            created_at: req.body.RegistrationCreatedAt || new Date()
        };

        await Registrations.create(dbRegistration);
        
        let redirectPath;
        if (sourceParticipantId) {
            redirectPath = `/registrations/participant/${sourceParticipantId}`;
        } else if (sourceEventId) {
            redirectPath = `/events/${sourceEventId}`;
        } else {
            redirectPath = `/registrations/event/${dbRegistration.event_occurrence_id}`;
        }
        res.redirect(redirectPath);

    } catch (err) {
        console.error(err);
        res.status(500).send("Error creating registration");
    }
});

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

router.post("/:oid/:pid/delete", requireAdmin, async (req, res) => {
    try {
        await Registrations.delete(req.params.oid, req.params.pid);
        
        // FIX: Check for returnTo in Admin Delete too
        if (req.body.returnTo) {
            return res.redirect(req.body.returnTo);
        }
        
        res.redirect(`/registrations/event/${req.params.oid}`);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting registration");
    }
});

/* ============================================================
   SHOW SINGLE REGISTRATION
============================================================ */
router.get("/:oid/:pid", requireLogin, async (req, res) => {
    try {
        const occurrenceId = req.params.oid;
        const participantId = req.params.pid;
        const registration = await Registrations.getByIds(occurrenceId, participantId);

        if (!registration) return res.status(404).send("Registration not found");

        const role = (req.session.access_level || "").toLowerCase();
        const isAuthorized = (role === 'manager' || role === 'admin') || 
                             (String(req.session.userID) === String(registration.participant_id));

        if (!isAuthorized) {
             return res.status(403).send("Unauthorized Access");
        }

        const targetUserId = registration.participant_id;
        const hasAttended = await Registrations.checkIfAttended(occurrenceId, targetUserId);
        const hasSubmittedSurvey = await Surveys.checkIfSubmitted(occurrenceId, targetUserId);
        const showSurveyButton = hasAttended && !hasSubmittedSurvey;

        res.render("registrations/show", {
            title: "Registration Details",
            registration,
            hasAttended,
            hasSubmittedSurvey,
            showSurveyButton,
            session: req.session 
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading details");
    }
});

module.exports = router;