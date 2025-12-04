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
        if (role === "manager" || role === "admin") {
            const occurrences = await EventOccurrences.getAll();
            
            return res.render("registrations/manager_index", {
                title: "Manage Registrations",
                occurrences
            });
        }

        // SCENARIO 2: PARTICIPANT LOGGED IN
        const myRegistrations = await Registrations.getByParticipant(req.session.userID);
        
        res.render("registrations/index", {
            title: "My Registrations",
            registrations: myRegistrations,
            contextName: "My" // Header: "My Registrations"
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Database Error");
    }
});


/* ============================================================
   NEW ROUTE: PARTICIPANT SELF-REGISTRATION (Logged-in users)
   POST /registrations/register/:id (where :id is event_occurrence_id)
============================================================ */
router.post("/register/:id", requireLogin, async (req, res) => {
    const occurrenceId = req.params.id;
    const participantId = req.session.userID;
    
    // We need the event details for the success message and redirect
    const occurrence = await EventOccurrences.getById(occurrenceId);
    const redirectUrl = `/eventOccurrences/${occurrenceId}`;

    if (!occurrence) {
        req.session.flashMessage = { type: 'error', text: 'Error: Event not found.' };
        return res.redirect(redirectUrl);
    }
    
    try {
        // 1. Check for existing registration (Duplication Feedback)
        const existingReg = await Registrations.getByIds(occurrenceId, participantId);
        if (existingReg) {
            req.session.flashMessage = { type: 'warning', text: `You are already registered for ${occurrence.event_name}.` };
            return res.redirect(redirectUrl); 
        }

        // 2. Create the registration record
        const newRegistration = {
            event_occurrence_id: Number(occurrenceId),
            participant_id: Number(participantId),
            status: 'registered', 
            attended: false,
            created_at: new Date()
        };

        await Registrations.create(newRegistration);
        
        // 3. Success Feedback & Redirect Fix
        req.session.flashMessage = { type: 'success', text: `Successfully registered for ${occurrence.event_name}!` };
        return res.redirect(redirectUrl); 

    } catch (err) {
        console.error("ERROR IN SELF-REGISTRATION:", err);
        req.session.flashMessage = { type: 'error', text: `Registration failed due to a server error.` };
        return res.redirect(redirectUrl);
    }
});

/* ============================================================
   NEW ROUTE: PARTICIPANT UNREGISTER (Logged-in users)
   POST /registrations/unregister/:id
============================================================ */
router.post("/unregister/:id", requireLogin, async (req, res) => {
    const occurrenceId = req.params.id;
    const participantId = req.session.userID;
    
    // Get event name for feedback and setup redirect URL
    const occurrence = await EventOccurrences.getById(occurrenceId);
    const redirectUrl = `/eventOccurrences/${occurrenceId}`;

    if (!occurrence) {
        req.session.flashMessage = { type: 'error', text: 'Error: Event not found.' };
        return res.redirect(redirectUrl);
    }

    try {
        // We use the delete function that takes two IDs
        const result = await Registrations.delete(occurrenceId, participantId); 

        if (result > 0) {
            req.session.flashMessage = { type: 'success', text: `Successfully unregistered from ${occurrence.event_name}.` };
        } else {
            req.session.flashMessage = { type: 'warning', text: `You were not registered for ${occurrence.event_name}.` };
        }
        
        return res.redirect(redirectUrl);

    } catch (err) {
        console.error("ERROR IN UNREGISTER:", err);
        req.session.flashMessage = { type: 'error', text: `Unregister failed due to a server error.` };
        return res.redirect(redirectUrl);
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
   NEW REGISTRATION (ADMIN ONLY)
============================================================ */
router.get("/new", requireAdmin, async (req, res) => {
    try {
        const participants = await Participants.getAll();
        const occurrences = await EventOccurrences.getAll();

        res.render("registrations/new", {
            title: "New Registration",
            participants,
            occurrences
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
            created_at: req.body.RegistrationCreatedAt || new Date()
        };

        await Registrations.create(newRegistration);
        
        // Redirect back to that event's list
        res.redirect(`/registrations/event/${newRegistration.event_occurrence_id}`);

    } catch (err) {
        console.error(err);
        res.status(500).send("Error creating registration");
    }
});


/* ============================================================
   EDIT REGISTRATION (ADMIN ONLY)
   URL: /:oid/:pid/edit
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

module.exports = router;