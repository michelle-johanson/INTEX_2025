const express = require("express");
const router = express.Router();

const { requireAdmin, requireLogin } = require("../middleware/auth");
const Registrations = require("../models/registrations");
const Participants = require("../models/participants");
const EventOccurrences = require("../models/eventOccurrences");

/* GET /registrations — index view */
router.get("/", requireLogin, async (req, res) => {
    try {
        const role = (req.session.access_level || "").toLowerCase();

        // Managers/Admins see occurrences for drill-down
        if (role === "manager" || role === "admin") {
            const occurrences = await EventOccurrences.getAll();
            return res.render("registrations/manager_index", {
                title: "Manage Registrations",
                occurrences
            });
        }

        // Participants go to their own page
        res.redirect(`/participants/${req.session.user_id}`);

    } catch (err) {
        console.error(err);
        res.status(500).send("Database Error");
    }
});

/* GET /registrations/participant/:id — registrations for one participant */
router.get("/participant/:id", requireLogin, async (req, res) => {
    try {
        const targetId = req.params.id;
        const loggedInId = req.session.user_id;

        const role = (req.session.access_level || "").toLowerCase();
        const isManager = role === "manager" || role === "admin";
        const isOwner = String(loggedInId) === String(targetId);

        if (!isManager && !isOwner) {
            return res.status(403).send("Unauthorized Access");
        }

        const registrations = await Registrations.getByParticipant(targetId);
        const participant = await Participants.getById(targetId);
        if (!participant) return res.status(404).send("Participant not found");

        res.render("registrations/index", {
            title: `${participant.first_name}'s Event Registrations`,
            registrations,
            contextName: `${participant.first_name}'s`,
            targetParticipantId: targetId,
            isManager
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading participant registrations");
    }
});

/* GET /registrations/event/:id — registrations for one event occurrence (admin) */
router.get("/event/:id", requireAdmin, async (req, res) => {
    try {
        const occurrenceId = req.params.id;

        const registrations = await Registrations.getByOccurrence(occurrenceId);
        const occurrence = await EventOccurrences.getById(occurrenceId);

        res.render("registrations/index", {
            title: `Registrations for ${occurrence.event_name}`,
            registrations,
            contextName: occurrence.event_name,
            parentOccurrenceId: occurrenceId,
            parentEventId: occurrence.event_id
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading event registrations");
    }
});

/* POST /registrations/register/:id — participant self-registration */
router.post("/register/:id", requireLogin, async (req, res) => {
    try {
        const occurrenceId = req.params.id;
        const participantId = req.session.user_id;

        const newRegistration = {
            event_occurrence_id: occurrenceId,
            participant_id: participantId,
            status: "Registered",
            attended: false,
            created_at: new Date()
        };

        await Registrations.create(newRegistration);

        const occurrence = await EventOccurrences.getById(occurrenceId);
        if (occurrence?.event_id) {
            return res.redirect(`/events/${occurrence.event_id}`);
        }

        res.redirect(`/participants/${participantId}`);

    } catch (err) {
        if (err.code === "23505") {
            try {
                const occurrence = await EventOccurrences.getById(req.params.id);
                if (occurrence?.event_id) {
                    return res.redirect(`/events/${occurrence.event_id}`);
                }
            } catch (lookupErr) {
                console.error("Lookup error:", lookupErr);
            }
            return res.redirect(`/participants/${req.session.user_id}`);
        }

        console.error("Self-registration error:", err);
        res.status(500).send("Error registering for event");
    }
});

/* GET /registrations/new — admin form */
router.get("/new", requireAdmin, async (req, res) => {
    try {
        const participants = await Participants.getAll();
        const occurrences = await EventOccurrences.getAll();

        res.render("registrations/new", {
            title: "New Registration",
            participants,
            occurrences,
            query: req.query // used for dropdown preselection
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading form");
    }
});

/* POST /registrations/new — admin creation */
router.post("/new", requireAdmin, async (req, res) => {
    try {
        const sourceEventId = req.body.SourceEventId;
        const sourceParticipantId = req.body.SourceParticipantId;

        const newRegistration = {
            event_occurrence_id: Number(req.body.EventOccurrenceID),
            participant_id: Number(req.body.ParticipantID),
            status: req.body.RegistrationStatus,
            attended: req.body.RegistrationAttendedFlag === "on",
            check_in_time: req.body.RegistrationCheckInTime || null,
            created_at: req.body.RegistrationCreatedAt || new Date()
        };

        await Registrations.create(newRegistration);

        if (sourceParticipantId) {
            return res.redirect(`/registrations/participant/${sourceParticipantId}`);
        }
        if (sourceEventId) {
            return res.redirect(`/events/${sourceEventId}`);
        }

        res.redirect(`/registrations/event/${newRegistration.event_occurrence_id}`);

    } catch (err) {
        console.error(err);
        res.status(500).send("Error creating registration");
    }
});

/* GET /registrations/:oid/:pid/edit — edit form (admin) */
router.get("/:oid/:pid/edit", requireAdmin, async (req, res) => {
    try {
        const registration = await Registrations.getByIds(req.params.oid, req.params.pid);
        if (!registration) return res.status(404).send("Registration not found");

        const participants = await Participants.getAll();
        const occurrences = await EventOccurrences.getAll();

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

/* POST /registrations/:oid/:pid/edit — update (admin) */
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

/* POST /registrations/:oid/:pid/delete — delete (admin) */
router.post("/:oid/:pid/delete", requireAdmin, async (req, res) => {
    try {
        await Registrations.delete(req.params.oid, req.params.pid);
        res.redirect(`/registrations/event/${req.params.oid}`);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting registration");
    }
});

/* GET /registrations/:oid/:pid — show single registration */
router.get("/:oid/:pid", requireLogin, async (req, res) => {
    try {
        const registration = await Registrations.getByIds(req.params.oid, req.params.pid);
        if (!registration) return res.status(404).send("Registration not found");

        const role = (req.session.access_level || "").toLowerCase();
        const isAuthorized =
            role === "manager" ||
            role === "admin" ||
            String(req.session.user_id) === String(registration.participant_id);

        if (!isAuthorized) {
            return res.status(403).send("Unauthorized Access");
        }

        res.render("registrations/show", {
            title: "Registration Details",
            registration
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading registration");
    }
});

module.exports = router;
