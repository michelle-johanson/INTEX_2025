// routes/surveys.js

const express = require("express");
const router = express.Router();

const { requireAdmin, requireLogin } = require("../middleware/auth");

const Surveys = require("../models/surveys");
const Participants = require("../models/participants");
const EventOccurrences = require("../models/eventOccurrences");
const Events = require("../models/events");

/* ============================================================
   LIST SURVEYS (LOGIN REQUIRED)
============================================================ */
router.get("/", requireLogin, (req, res) => {
    const surveys = Surveys.getAll();
    const participants = Participants.getAll();
    const occurrences = EventOccurrences.getAll();
    const events = Events.getAll();

    // join for UI
    const enhanced = surveys.map(s => {
        const participant = participants.find(p => p.ParticipantID === s.ParticipantID);
        const occurrence = occurrences.find(o => o.EventOccurrenceID === s.EventOccurrenceID);
        const event = occurrence ? events.find(e => e.EventID === occurrence.EventID) : null;

        return {
            ...s,
            ParticipantName: participant ? `${participant.FirstName} ${participant.LastName}` : "Unknown",
            EventName: event ? event.EventName : "Unknown",
            EventDateTimeStart: occurrence ? occurrence.EventDateTimeStart : "Unknown"
        };
    });

    res.render("surveys/index", {
        title: "Post-Event Surveys",
        surveys: enhanced
    });
});


/* ============================================================
   NEW SURVEY (ADMIN ONLY)
============================================================ */

// Show form
router.get("/new", requireAdmin, (req, res) => {
    res.render("surveys/new", {
        title: "New Survey",
        participants: Participants.getAll(),
        occurrences: EventOccurrences.getAll(),
        events: Events.getAll()
    });
});

// Submit
router.post("/new", requireAdmin, (req, res) => {
    Surveys.create({
        EventOccurrenceID: Number(req.body.EventOccurrenceID),
        ParticipantID: Number(req.body.ParticipantID),
        SurveySatisfactionScore: Number(req.body.SurveySatisfactionScore),
        SurveyUsefulnessScore: Number(req.body.SurveyUsefulnessScore),
        SurveyRecommendationScore: Number(req.body.SurveyRecommendationScore),
        SurveyOverallScore: Number(req.body.SurveyOverallScore),
        SurveyComments: req.body.SurveyComments,
        SurveySubmissionDate: req.body.SurveySubmissionDate
    });

    res.redirect("/surveys");
});


/* ============================================================
   EDIT SURVEY (ADMIN ONLY)
============================================================ */
router.get("/:occurrenceID/:participantID/edit", requireAdmin, (req, res) => {
    const survey = Surveys.getByIds(
        req.params.occurrenceID,
        req.params.participantID
    );

    if (!survey) return res.status(404).send("Survey not found");

    res.render("surveys/edit", {
        title: "Edit Survey",
        survey,
        participants: Participants.getAll(),
        occurrences: EventOccurrences.getAll(),
        events: Events.getAll()
    });
});

// Submit edits
router.post("/:occurrenceID/:participantID/edit", requireAdmin, (req, res) => {
    Surveys.update(
        req.params.occurrenceID,
        req.params.participantID,
        {
            SurveySatisfactionScore: Number(req.body.SurveySatisfactionScore),
            SurveyUsefulnessScore: Number(req.body.SurveyUsefulnessScore),
            SurveyRecommendationScore: Number(req.body.SurveyRecommendationScore),
            SurveyOverallScore: Number(req.body.SurveyOverallScore),
            SurveyComments: req.body.SurveyComments,
            SurveySubmissionDate: req.body.SurveySubmissionDate
        }
    );

    res.redirect("/surveys");
});


/* ============================================================
   DELETE SURVEY (ADMIN ONLY)
============================================================ */
router.post("/:occurrenceID/:participantID/delete", requireAdmin, (req, res) => {
    Surveys.delete(req.params.occurrenceID, req.params.participantID);
    res.redirect("/surveys");
});


/* ============================================================
   SHOW SINGLE SURVEY (LOGIN REQUIRED)
============================================================ */
router.get("/:occurrenceID/:participantID", requireLogin, (req, res) => {
    const survey = Surveys.getByIds(
        req.params.occurrenceID,
        req.params.participantID
    );

    if (!survey) return res.status(404).send("Survey not found");

    const participant = Participants.getById(survey.ParticipantID);
    const occurrence = EventOccurrences.getById(survey.EventOccurrenceID);
    const event = occurrence ? Events.getById(occurrence.EventID) : null;

    res.render("surveys/show", {
        title: "Survey Details",
        survey,
        participant,
        occurrence,
        event
    });
});

module.exports = router;
