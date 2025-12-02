// routes/surveys.js

const express = require("express");
const router = express.Router();

const { requireAdmin, requireLogin } = require("../middleware/auth");

const Surveys = require("../models/surveys");
const Participants = require("../models/participants");
const EventOccurrences = require("../models/eventOccurrences");

/* ============================================================
   MAIN INDEX ROUTE (SPLIT VIEW LOGIC)
============================================================ */
router.get("/", requireLogin, async (req, res) => {
    try {
        // Safe role check (lowercase)
        const role = (req.session.access_level || "").toLowerCase();

        // SCENARIO 1: MANAGER LOGGED IN
        // Show a Directory of EVENTS so they can pick one to view results for.
        if (role === "manager" || role === "admin") {
            const occurrences = await EventOccurrences.getAll();
            
            return res.render("surveys/manager_index", {
                title: "Survey Management",
                occurrences
            });
        }

        // SCENARIO 2: PARTICIPANT LOGGED IN
        // Show only their OWN surveys.
        const mySurveys = await Surveys.getByParticipant(req.session.userID);
        
        res.render("surveys/index", {
            title: "My Surveys",
            surveys: mySurveys,
            contextName: "My" // Header will say "My Surveys"
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Database Error");
    }
});


/* ============================================================
   MANAGER DRILL-DOWN: View Surveys for ONE Event
   URL: /surveys/occurrence/5
============================================================ */
router.get("/occurrence/:id", requireAdmin, async (req, res) => {
    try {
        const occurrenceId = req.params.id;

        // Fetch all surveys for this specific event occurrence
        const eventSurveys = await Surveys.getByOccurrence(occurrenceId);
        
        // Fetch the occurrence details just for the Page Title
        const occurrence = await EventOccurrences.getById(occurrenceId);

        res.render("surveys/index", {
            title: `Surveys for ${occurrence.event_name}`,
            surveys: eventSurveys,
            contextName: `${occurrence.event_name}` // Header: "STEAM Night Surveys"
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading event surveys");
    }
});


/* ============================================================
   NEW SURVEY (ADMIN ONLY)
============================================================ */
router.get("/new", requireAdmin, async (req, res) => {
    try {
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

router.post("/new", requireAdmin, async (req, res) => {
    try {
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
        
        // Redirect back to that specific event's list
        res.redirect(`/surveys/occurrence/${newSurvey.event_occurrence_id}`);

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
        
        // Redirect back to that event's list
        res.redirect(`/surveys/occurrence/${req.params.oid}`);

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
        
        // Redirect back to that event's list
        res.redirect(`/surveys/occurrence/${req.params.oid}`);
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
        const survey = await Surveys.getByIds(req.params.oid, req.params.pid);

        if (!survey) return res.status(404).send("Survey not found");

        // SECURITY CHECK
        const role = (req.session.access_level || "").toLowerCase();
        const isAuthorized = (role === 'manager' || role === 'admin') || 
                             (req.session.userID === survey.participant_id);

        if (!isAuthorized) {
             return res.status(403).send("Unauthorized Access");
        }

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