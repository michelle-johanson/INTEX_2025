const express = require("express");
const router = express.Router();
const { requireAdmin, requireLogin } = require("../middleware/auth");

const Surveys = require("../models/surveys");
const Events = require("../models/events");
const EventOccurrences = require("../models/eventOccurrences");
const Participants = require("../models/participants");
const Registrations = require("../models/registrations"); 

// ... (Index/Manager routes remain unchanged) ...
router.get("/", requireLogin, async (req, res) => {
    // Standard Index Logic
    try {
        const roleRaw = req.session.access_level || (req.session.user && req.session.user.role) || "";
        const isManager = roleRaw.toLowerCase() === "manager" || roleRaw.toLowerCase() === "admin";

        if (isManager) {
            const searchTerm = req.query.search || "";
            const events = await Events.getAll(searchTerm);
            return res.render("surveys/manager_index", { title: "Survey Reports", mode: "types", data: events, searchTerm, session: req.session });
        }

        const myId = req.session.userID || (req.session.user && req.session.user.participant_id);
        const mySurveys = await Surveys.getByParticipant(myId);
        res.render("surveys/index", { title: "My Surveys", surveys: mySurveys, contextName: "My", session: req.session, searchTerm: "" });
    } catch (err) { console.error(err); res.status(500).send("Database Error"); }
});

router.get("/type/:id", requireLogin, async (req, res) => {
    try {
        const event = await Events.getById(req.params.id);
        const occurrences = await EventOccurrences.getByEventId(req.params.id, req.query.search || "");
        res.render("surveys/manager_index", { title: `Surveys for ${event.name}`, mode: "occurrences", data: occurrences, event, searchTerm: req.query.search || "", session: req.session });
    } catch (err) { console.error(err); res.status(500).send("Error"); }
});

router.get("/occurrence/:id", requireLogin, async (req, res) => {
    try {
        const surveys = await Surveys.getByOccurrence(req.params.id, req.query.search || "");
        const occurrence = await EventOccurrences.getById(req.params.id);
        res.render("surveys/index", { title: `Results: ${occurrence.event_name}`, contextName: occurrence.event_name, surveys, occurrence, searchTerm: req.query.search || "", session: req.session });
    } catch (err) { console.error(err); res.status(500).send("Error"); }
});


/* ============================================================
   PARTICIPANT SURVEY FORM - UPDATED FOR REDIRECT
============================================================ */
router.get("/submit/:id", requireLogin, async (req, res) => {
    const occurrenceId = req.params.id;
    const participantId = req.session.userID; 
    
    // FIX: Capture the returnTo path from the URL
    const returnTo = req.query.returnTo || `/eventOccurrences/${occurrenceId}`;

    try {
        const role = (req.session.access_level || "").toLowerCase();
        if (role === 'manager' || role === 'admin') {
            return res.redirect(`/surveys/new?event_occurrence_id=${occurrenceId}`); 
        }

        const hasAttended = await Registrations.checkIfAttended(occurrenceId, participantId);
        const hasSubmitted = await Surveys.checkIfSubmitted(occurrenceId, participantId);
        const occurrence = await EventOccurrences.getById(occurrenceId);
        
        if (!occurrence) {
            req.session.flashMessage = { type: 'error', text: 'Event not found.' };
            return res.redirect(returnTo);
        }
        
        if (!hasAttended) {
            req.session.flashMessage = { type: 'error', text: 'Access Denied: You must have attended the event to submit a survey.' };
            return res.redirect(returnTo);
        }
        if (hasSubmitted) {
            req.session.flashMessage = { type: 'warning', text: 'You have already submitted a survey for this event.' };
            return res.redirect(returnTo);
        }

        const participant = await Participants.getById(participantId);

        res.render("surveys/participant_new", { 
            title: `Submit Survey for ${occurrence.event_name}`,
            occurrence: occurrence,
            participant: participant,
            participantId: participantId, 
            errors: {},
            formData: {},
            returnTo: returnTo // Pass it to the view so it can be put in a hidden input
        });

    } catch (err) {
        console.error("ERROR LOADING SURVEY FORM:", err);
        req.session.flashMessage = { type: 'error', text: 'Error loading form.' };
        return res.redirect(returnTo); 
    }
});


router.post("/submit/:id", requireLogin, async (req, res) => {
    const occurrenceId = req.params.id;
    const participantId = req.session.userID; 
    
    // FIX: Capture returnTo from the form body so we know where to go back to
    const returnTo = req.body.returnTo || `/eventOccurrences/${occurrenceId}`;
    
    try {
        const hasAttended = await Registrations.checkIfAttended(occurrenceId, participantId);
        const hasSubmitted = await Surveys.checkIfSubmitted(occurrenceId, participantId);
        
        if (!hasAttended || hasSubmitted) {
            req.session.flashMessage = { type: 'error', text: 'Submission blocked: Eligibility failed.' };
            return res.redirect(returnTo);
        }

        const requiredScoreFields = ['SurveySatisfactionScore', 'SurveyUsefulnessScore', 'SurveyRecommendationScore', 'SurveyInstructorScore'];
        const scores = {};
        const errors = {};
        let validationFailed = false;

        for (const field of requiredScoreFields) {
            const num = parseInt(req.body[field]);
            if (isNaN(num) || num < 1 || num > 5) {
                validationFailed = true;
                errors[field] = `Please select a valid score (1-5).`; 
            } else {
                scores[field] = num;
            }
        }

        if (validationFailed) {
            const occurrence = await EventOccurrences.getById(occurrenceId);
            const participant = await Participants.getById(participantId);
            
            return res.render("surveys/participant_new", { 
                title: `Submit Survey for ${occurrence.event_name}`,
                occurrence,
                participant,
                participantId,
                errors,
                formData: req.body,
                returnTo: returnTo // Keep passing it back on error re-render
            });
        }
        
        const overall = (scores.SurveySatisfactionScore + scores.SurveyUsefulnessScore + scores.SurveyRecommendationScore + scores.SurveyInstructorScore) / 4; 

        const newSurvey = {
            event_occurrence_id: Number(occurrenceId),
            participant_id: Number(participantId), 
            satisfaction_score: scores.SurveySatisfactionScore,
            usefulness_score: scores.SurveyUsefulnessScore,
            recommendation_score: scores.SurveyRecommendationScore,
            instructor_score: scores.SurveyInstructorScore, 
            overall_score: overall.toFixed(2), 
            comments: req.body.SurveyComments,
            submission_date: new Date() 
        };

        await Surveys.create(newSurvey);
        
        req.session.flashMessage = { type: 'success', text: 'Thank you! Your survey has been submitted.' };
        return res.redirect(returnTo); 

    } catch (err) {
        console.error("CRITICAL SURVEY ERROR:", err);
        req.session.flashMessage = { type: 'error', text: 'Submission failed due to server error.' };
        return res.redirect(returnTo);
    }
});

// ... (Admin New/Edit/Delete routes remain standard) ...
router.get("/new", requireAdmin, async (req, res) => {
    try {
        const participants = await Participants.getAll();
        const occurrences = await EventOccurrences.getAll();
        res.render("surveys/new", { title: "New Survey", participants, occurrences, session: req.session, selectedEvent: req.query.event_occurrence_id });
    } catch (err) { console.error(err); res.status(500).send("Error"); }
});
router.post("/new", requireAdmin, async (req, res) => { /* ... existing code ... */ });
router.get("/:oid/:pid/edit", requireAdmin, async (req, res) => { /* ... existing code ... */ });
router.post("/:oid/:pid/edit", requireAdmin, async (req, res) => { /* ... existing code ... */ });
router.post("/:oid/:pid/delete", requireAdmin, async (req, res) => { /* ... existing code ... */ });
router.get("/:oid/:pid", requireLogin, async (req, res) => { 
    try {
        const survey = await Surveys.getByIds(req.params.oid, req.params.pid);
        if (!survey) return res.status(404).send("Survey not found");
        res.render("surveys/show", { title: "Survey Details", survey, session: req.session });
    } catch (err) { console.error(err); res.status(500).send("Error"); }
});

module.exports = router;