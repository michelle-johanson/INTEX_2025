// routes/surveys.js

const express = require("express");
const router = express.Router();

const { requireAdmin, requireLogin } = require("../middleware/auth");

const Surveys = require("../models/surveys");
// We still need these for the "New/Edit" dropdown menus
const Participants = require("../models/participants");
const EventOccurrences = require("../models/eventOccurrences");

/* ============================================================
   LIST SURVEYS (LOGIN REQUIRED)
============================================================ */
router.get("/", requireLogin, async (req, res) => {
    try {
        const surveys = await Surveys.getAll();

        res.render("surveys/index", {
            title: "Post-Event Surveys",
            surveys
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Database Error");
    }
});


/* ============================================================
   NEW SURVEY (ADMIN ONLY)
============================================================ */

// Show form
router.get("/new", requireAdmin, async (req, res) => {
    try {
        // Fetch data for dropdowns
        const participants = await Participants.getAll();
        const occurrences = await EventOccurrences.getAll();

        res.render("surveys/new", {
            title: "New Survey",
            participants,
            occurrences
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading form");
    }
});

// Submit
router.post("/new", requireAdmin, async (req, res) => {
    try {
        // MAP FORM DATA TO DATABASE COLUMNS
        const newSurvey = {
            event_occurrence_id: Number(req.body.EventOccurrenceID),
            participant_id: Number(req.body.ParticipantID),
            satisfaction_score: Number(req.body.SurveySatisfactionScore),
            usefulness_score: Number(req.body.SurveyUsefulnessScore),
            recommendation_score: Number(req.body.SurveyRecommendationScore),
            overall_score: Number(req.body.SurveyOverallScore),
            comments: req.body.SurveyComments,
            submission_date: req.body.SurveySubmissionDate || new Date()
        };

        await Surveys.create(newSurvey);
        res.redirect("/surveys");

    } catch (err) {
        console.error(err);
        res.status(500).send("Error creating survey");
    }
});


/* ============================================================
   EDIT SURVEY (ADMIN ONLY)
   URL: /surveys/:oid/:pid/edit
============================================================ */
router.get("/:oid/:pid/edit", requireAdmin, async (req, res) => {
    try {
        const survey = await Surveys.getByIds(req.params.oid, req.params.pid);
        const participants = await Participants.getAll();
        const occurrences = await EventOccurrences.getAll();

        if (!survey) return res.status(404).send("Survey not found");

        res.render("surveys/edit", {
            title: "Edit Survey",
            survey,
            participants,
            occurrences
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading edit form");
    }
});

// Submit edits
router.post("/:oid/:pid/edit", requireAdmin, async (req, res) => {
    try {
        const updates = {
            satisfaction_score: Number(req.body.SurveySatisfactionScore),
            usefulness_score: Number(req.body.SurveyUsefulnessScore),
            recommendation_score: Number(req.body.SurveyRecommendationScore),
            overall_score: Number(req.body.SurveyOverallScore),
            comments: req.body.SurveyComments,
            submission_date: req.body.SurveySubmissionDate
        };

        await Surveys.update(req.params.oid, req.params.pid, updates);
        res.redirect("/surveys");

    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating survey");
    }
});


/* ============================================================
   DELETE SURVEY (ADMIN ONLY)
============================================================ */
router.post("/:oid/:pid/delete", requireAdmin, async (req, res) => {
    try {
        await Surveys.delete(req.params.oid, req.params.pid);
        res.redirect("/surveys");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting survey");
    }
});


/* ============================================================
   SHOW SINGLE SURVEY (LOGIN REQUIRED)
============================================================ */
router.get("/:oid/:pid", requireLogin, async (req, res) => {
    try {
        // The Model JOIN already grabbed the names we need!
        const survey = await Surveys.getByIds(req.params.oid, req.params.pid);

        if (!survey) return res.status(404).send("Survey not found");

        res.render("surveys/show", {
            title: "Survey Details",
            survey
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading details");
    }
});

module.exports = router;