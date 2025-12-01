// routes/surveys.js

const express = require("express");
const router = express.Router();

const { requireAdmin, requireLogin } = require("../middleware/auth");
const Surveys = require("../models/fakeSurveys");
const Participants = require("../models/fakeParticipants");
const Events = require("../models/fakeEvents");

/* ============================================================
    LIST SURVEYS  (LOGIN REQUIRED)
============================================================ */
router.get("/", requireLogin, (req, res) => {
    const surveys = Surveys.getAll();
    res.render("surveys/index", {
        title: "Surveys",
        surveys
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
        events: Events.getAll()
    });
});

// Submit
router.post("/new", requireAdmin, (req, res) => {
    Surveys.add({
        participant_id: Number(req.body.participant_id),
        event_id: Number(req.body.event_id),
        rating: Number(req.body.rating),
        comments: req.body.comments,
        date_taken: req.body.date_taken
    });

    res.redirect("/surveys");
});


/* ============================================================
    EDIT SURVEY (ADMIN ONLY)
============================================================ */

router.get("/:id/edit", requireAdmin, (req, res) => {
    const survey = Surveys.getById(req.params.id);
    if (!survey) return res.status(404).send("Survey not found");

    res.render("surveys/edit", {
        title: "Edit Survey",
        survey,
        participants: Participants.getAll(),
        events: Events.getAll()
    });
});

router.post("/:id/edit", requireAdmin, (req, res) => {
    Surveys.update(req.params.id, {
        participant_id: Number(req.body.participant_id),
        event_id: Number(req.body.event_id),
        rating: Number(req.body.rating),
        comments: req.body.comments,
        date_taken: req.body.date_taken
    });

    res.redirect("/surveys");
});


/* ============================================================
    DELETE SURVEY  (ADMIN ONLY)
============================================================ */

router.post("/:id/delete", requireAdmin, (req, res) => {
    Surveys.delete(req.params.id);
    res.redirect("/surveys");
});


/* ============================================================
    SHOW SURVEY  (LOGIN REQUIRED)
============================================================ */
router.get("/:id", requireLogin, (req, res) => {
    const survey = Surveys.getById(req.params.id);
    if (!survey) return res.status(404).send("Survey not found");

    res.render("surveys/show", {
        title: "Survey Details",
        survey,
        participant: Participants.getById(survey.participant_id),
        event: Events.getById(survey.event_id)
    });
});

module.exports = router;
