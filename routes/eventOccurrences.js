const express = require("express");
const router = express.Router();

const { requireAdmin, requireLogin } = require("../middleware/auth");
const EventOccurrences = require("../models/eventOccurrences");
const Events = require("../models/events");
const Registrations = require("../models/registrations");
const SurveyResponses = require("../models/surveys");

/* GET /eventOccurrences — list all occurrences (supports search) */
router.get("/", requireLogin, async (req, res) => {
    try {
        const query = req.query.q || "";
        const occurrences = await EventOccurrences.getAll(query);

        res.render("eventOccurrences/index", {
            title: "Event Occurrences",
            occurrences,
            query
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Database Error");
    }
});

/* GET /eventOccurrences/new — new occurrence form */
router.get("/new", requireAdmin, async (req, res) => {
    try {
        const events = await Events.getAll();
        const selectedEventId = req.query.event_id || "";

        res.render("eventOccurrences/new", {
            title: "Schedule New Occurrence",
            events,
            selectedEventId,
            errors: {},
            formData: {}
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading form");
    }
});

/* POST /eventOccurrences/new — create occurrence */
router.post("/new", requireAdmin, async (req, res) => {
    try {
        const dbData = {
            event_id: req.body.EventID,
            starts_at: req.body.EventDateTimeStart,
            ends_at: req.body.EventDateTimeEnd,
            location: req.body.EventLocation,
            capacity: req.body.EventCapacity,
            registration_deadline: req.body.EventRegistrationDeadline
        };

        const errors = {};
        const start = new Date(dbData.starts_at);
        const end = new Date(dbData.ends_at);

        const startDateString = dbData.starts_at ? dbData.starts_at.split("T")[0] : "";
        const deadlineString = dbData.registration_deadline || "";

        if (dbData.ends_at && start >= end) {
            errors.EndsAt = "End time must be after the start time.";
        }

        if (deadlineString && startDateString && deadlineString > startDateString) {
            errors.RegistrationDeadline = "Registration deadline cannot be after the event start date.";
        }

        if (Object.keys(errors).length > 0) {
            const events = await Events.getAll();

            const formData = {
                EventID: req.body.EventID,
                EventLocation: req.body.EventLocation,
                EventCapacity: req.body.EventCapacity,
                EventDateTimeStart: "",
                EventDateTimeEnd: "",
                EventRegistrationDeadline: ""
            };

            return res.render("eventOccurrences/new", {
                title: "Schedule New Occurrence",
                events,
                selectedEventId: req.body.EventID,
                errors,
                formData
            });
        }

        await EventOccurrences.create(dbData);
        res.redirect(`/events/${dbData.event_id}`);

    } catch (err) {
        console.error("Error creating occurrence:", err);
        res.status(500).send("Error creating occurrence");
    }
});

/* GET /eventOccurrences/:id — view single occurrence */
router.get("/:id", requireLogin, async (req, res) => {
    try {
        const id = req.params.id;
        const participantId = req.session.user_id;

        const flashMessage = req.session.flashMessage;
        if (flashMessage) delete req.session.flashMessage;

        const occurrence = await EventOccurrences.getById(id);
        if (!occurrence) return res.status(404).send("Occurrence not found");

        let registrationStatus = null;
        let hasAttended = false;
        let hasSubmittedSurvey = false;

        if (req.session.isLoggedIn && participantId) {
            const reg = await Registrations.getByIds(id, participantId);
            registrationStatus = reg ? reg.status : null;

            hasAttended = await Registrations.checkIfAttended(id, participantId);
            hasSubmittedSurvey = await SurveyResponses.checkIfSubmitted(id, participantId);
        }

        const showSurveyButton = hasAttended && !hasSubmittedSurvey;

        res.render("eventOccurrences/show", {
            title: occurrence.event_name,
            occurrence,
            session: req.session,
            registrationStatus,
            flashMessage,
            hasAttended,
            hasSubmittedSurvey,
            showSurveyButton
        });

    } catch (err) {
        console.error("ERROR LOADING OCCURRENCE:", err);
        res.status(500).send("Error loading occurrence");
    }
});

/* GET /eventOccurrences/:id/edit — edit form */
router.get("/:id/edit", requireAdmin, async (req, res) => {
    try {
        const occurrence = await EventOccurrences.getById(req.params.id);
        if (!occurrence) return res.status(404).send("Occurrence not found");

        const events = await Events.getAll();

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

/* POST /eventOccurrences/:id/edit — update occurrence */
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

        const errors = {};
        const start = new Date(dbData.starts_at);
        const end = new Date(dbData.ends_at);

        const startDateString = dbData.starts_at ? dbData.starts_at.split("T")[0] : "";
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

            const formData = {
                event_id: req.body.EventID,
                location: req.body.EventLocation,
                capacity: req.body.EventCapacity,
                starts_at: "",
                ends_at: "",
                registration_deadline: ""
            };

            return res.render("eventOccurrences/edit", {
                title: "Edit Occurrence",
                occurrence: originalOccurrence,
                events,
                errors,
                formData
            });
        }

        await EventOccurrences.update(req.params.id, dbData);
        res.redirect(`/eventOccurrences/${req.params.id}`);

    } catch (err) {
        console.error("Error updating occurrence:", err);
        res.status(500).send("Error updating occurrence");
    }
});

/* POST /eventOccurrences/:id/delete — delete occurrence */
router.post("/:id/delete", requireAdmin, async (req, res) => {
    try {
        const occurrence = await EventOccurrences.getById(req.params.id);
        const parentEventId = occurrence ? occurrence.event_id : null;

        await Registrations.deleteByOccurrenceId(req.params.id);
        await SurveyResponses.deleteByOccurrenceId(req.params.id);
        await EventOccurrences.delete(req.params.id);

        if (parentEventId) {
            return res.redirect(`/events/${parentEventId}`);
        }

        res.redirect("/eventOccurrences");

    } catch (err) {
        console.error("ERROR DELETING OCCURRENCE:", err);
        res.status(500).send("Error deleting occurrence");
    }
});

module.exports = router;
