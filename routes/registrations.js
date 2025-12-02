// routes/registrations.js

const express = require("express");
const router = express.Router();

const { requireAdmin, requireLogin } = require("../middleware/auth");

const Registrations = require("../models/registrations");
const Participants = require("../models/participants");
const EventOccurrences = require("../models/eventOccurrences");
const Events = require("../models/events");  // optional for dropdowns

/* ============================================================
    LIST REGISTRATIONS (LOGIN REQUIRED)
============================================================ */
router.get("/", requireLogin, (req, res) => {
    const registrations = Registrations.getAll();
    const participants = Participants.getAll();
    const occurrences = EventOccurrences.getAll();
    const events = Events.getAll();

    // Join for readability
    const enhanced = registrations.map(r => {
        const participant = participants.find(p => p.ParticipantID === r.ParticipantID);
        const occurrence = occurrences.find(o => o.EventOccurrenceID === r.EventOccurrenceID);
        const eventTemplate = occurrence
            ? events.find(e => e.EventID === occurrence.EventID)
            : null;

        return {
            ...r,
            ParticipantName: participant
                ? `${participant.FirstName} ${participant.LastName}`
                : "Unknown",
            EventName: eventTemplate ? eventTemplate.EventName : "Unknown",
            EventDateTimeStart: occurrence ? occurrence.EventDateTimeStart : "Unknown"
        };
    });

    res.render("registrations/index", {
        title: "Registrations",
        registrations: enhanced
    });
});


/* ============================================================
    NEW REGISTRATION (ADMIN ONLY)
============================================================ */

// Show form
router.get("/new", requireAdmin, (req, res) => {
    res.render("registrations/new", {
        title: "New Registration",
        participants: Participants.getAll(),
        occurrences: EventOccurrences.getAll(),
        events: Events.getAll()
    });
});

// Submit new registration
router.post("/new", requireAdmin, (req, res) => {
    Registrations.create({
        EventOccurrenceID: Number(req.body.EventOccurrenceID),
        ParticipantID: Number(req.body.ParticipantID),
        RegistrationStatus: req.body.RegistrationStatus,
        RegistrationAttendedFlag: req.body.RegistrationAttendedFlag === "on",
        RegistrationCheckInTime: req.body.RegistrationCheckInTime || null,
        RegistrationCreatedAt: req.body.RegistrationCreatedAt
    });

    res.redirect("/registrations");
});


/* ============================================================
    EDIT REGISTRATION (ADMIN ONLY)
============================================================ */
router.get("/:occurrenceID/:participantID/edit", requireAdmin, (req, res) => {
    const registration = Registrations.getByIds(
        req.params.occurrenceID,
        req.params.participantID
    );

    if (!registration) return res.status(404).send("Registration not found");

    res.render("registrations/edit", {
        title: "Edit Registration",
        registration,
        participants: Participants.getAll(),
        occurrences: EventOccurrences.getAll()
    });
});

router.post("/:occurrenceID/:participantID/edit", requireAdmin, (req, res) => {
    Registrations.update(
        req.params.occurrenceID,
        req.params.participantID,
        {
            RegistrationStatus: req.body.RegistrationStatus,
            RegistrationAttendedFlag: req.body.RegistrationAttendedFlag === "on",
            RegistrationCheckInTime: req.body.RegistrationCheckInTime || null,
            RegistrationCreatedAt: req.body.RegistrationCreatedAt
        }
    );

    res.redirect("/registrations");
});


/* ============================================================
    DELETE REGISTRATION (ADMIN ONLY)
============================================================ */
router.post("/:occurrenceID/:participantID/delete", requireAdmin, (req, res) => {
    Registrations.delete(
        req.params.occurrenceID,
        req.params.participantID
    );

    res.redirect("/registrations");
});


/* ============================================================
    SHOW SINGLE REGISTRATION (LOGIN REQUIRED)
============================================================ */
router.get("/:occurrenceID/:participantID", requireLogin, (req, res) => {
    const registration = Registrations.getByIds(
        req.params.occurrenceID,
        req.params.participantID
    );

    if (!registration) return res.status(404).send("Registration not found");

    const participant = Participants.getById(registration.ParticipantID);
    const occurrence = EventOccurrences.getById(registration.EventOccurrenceID);
    const event = occurrence ? Events.getById(occurrence.EventID) : null;

    res.render("registrations/show", {
        title: "Registration Details",
        registration,
        participant,
        occurrence,
        event
    });
});

module.exports = router;
