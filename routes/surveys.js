const express = require("express");
const router = express.Router();
const { requireAdmin, requireLogin } = require("../middleware/auth");

// MODELS
const Surveys = require("../models/surveys");
const Events = require("../models/events");
const EventOccurrences = require("../models/eventOccurrences");
const Participants = require("../models/participants");
// Need Registrations model for attendance check
const Registrations = require("../models/registrations"); 

/* ============================================================
   LEVEL 1: MAIN INDEX
============================================================ */
router.get("/", requireLogin, async (req, res) => {
    try {
        // --- 1. ROBUST SESSION CHECK (UPDATED) ---
        const roleRaw = req.session.access_level || 
                        req.session.role || 
                        (req.session.user && (req.session.user.access_level || req.session.user.role)) || 
                        "";
                        
        const userRole = roleRaw.toLowerCase();
        const isManager = userRole === "manager" || userRole === "admin";

        // --- SCENARIO A: MANAGER (Show Event Types) ---
        if (isManager) {
            const searchTerm = req.query.search || "";
            const events = await Events.getAll(searchTerm);
            
            return res.render("surveys/manager_index", { 
                title: "Survey Reports - Select Event Type",
                mode: "types", 
                data: events,
                searchTerm,
                session: req.session
            });
        }

        // --- SCENARIO B: PARTICIPANT (Show Own Surveys) ---
        const myId = (req.session.user && req.session.user.participant_id) || 
                     req.session.participant_id || 
                     req.session.userID;

        if (!myId) {
            console.error("LOGIN ERROR: User is logged in, but no ID found in session.");
            return res.status(500).send("Error: Could not find your Participant ID. Please log out and log back in.");
        }

        const mySurveys = await Surveys.getByParticipant(myId);
        
        res.render("surveys/index", { 
            title: "My Surveys",
            surveys: mySurveys,
            contextName: "My",
            session: req.session,
            searchTerm: ""
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Database Error");
    }
});

/* ============================================================
   LEVEL 2: DRILL DOWN - LIST OCCURRENCES
============================================================ */
router.get("/type/:id", requireLogin, async (req, res) => {
    try {
        const event = await Events.getById(req.params.id);
        if (!event) return res.status(404).send("Event not found");

        const searchTerm = req.query.search || "";
        const occurrences = await EventOccurrences.getByEventId(req.params.id, searchTerm);

        res.render("surveys/manager_index", { 
            title: `Surveys for ${event.name}`,
            mode: "occurrences",
            data: occurrences,
            event, 
            searchTerm,
            session: req.session
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading occurrences");
    }
});

/* ============================================================
   LEVEL 3: DRILL DOWN - LIST ACTUAL SURVEYS
============================================================ */
router.get("/occurrence/:id", requireLogin, async (req, res) => {
    try {
        const occurrenceId = req.params.id;
        const searchTerm = req.query.search || "";

        const eventSurveys = await Surveys.getByOccurrence(occurrenceId, searchTerm);
        
        const rawOccurrence = await EventOccurrences.getById(occurrenceId);
        const occurrence = rawOccurrence || {};
        const titleContext = occurrence.event_name || `ID ${occurrenceId}`;

        res.render("surveys/index", { 
            title: `Results: ${titleContext}`,
            contextName: titleContext,
            surveys: eventSurveys,
            occurrence: occurrence,
            searchTerm,
            session: req.session
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading event surveys");
    }
});

/* ============================================================
   NEW ROUTE: PARTICIPANT SURVEY FORM (Self-Service GET)
   URL: /surveys/submit/:id
============================================================ */
router.get("/submit/:id", requireLogin, async (req, res) => {
    const occurrenceId = req.params.id;
    const participantId = req.session.userID; 
    const redirectUrl = `/eventOccurrences/${occurrenceId}`;

    try {
        // --- SECURITY CHECK 1: Manager Bypass ---
        const role = (req.session.access_level || "").toLowerCase();
        if (role === 'manager' || role === 'admin') {
            // Managers use the standard admin form flow
            return res.redirect(`/surveys/new?event_occurrence_id=${occurrenceId}`); 
        }

        // --- SECURITY CHECK 2: Eligibility ---
        const hasAttended = await Registrations.checkIfAttended(occurrenceId, participantId);
        const hasSubmitted = await Surveys.checkIfSubmitted(occurrenceId, participantId);
        const occurrence = await EventOccurrences.getById(occurrenceId);
        
        if (!occurrence) {
            req.session.flashMessage = { type: 'error', text: 'Event not found.' };
            return res.redirect(`/events/${occurrence.event_id}`);
        }
        
        if (!hasAttended) {
            req.session.flashMessage = { type: 'error', text: 'Access Denied: You must have attended the event to submit a survey.' };
            return res.redirect(redirectUrl);
        }
        if (hasSubmitted) {
            req.session.flashMessage = { type: 'warning', text: 'You have already submitted a survey for this event.' };
            return res.redirect(redirectUrl);
        }

        // Fetch user's first/last name for the form display
        const participant = await Participants.getById(participantId);

        res.render("surveys/participant_new", { // NEW VIEW: participant_new.ejs
            title: `Submit Survey for ${occurrence.event_name}`,
            occurrence: occurrence,
            participant: participant,
            participantId: participantId, // CRITICAL: Pass the raw ID
            // Pass empty errors/form data for initial load
            errors: {},
            formData: {}
        });

    } catch (err) {
        console.error("ERROR LOADING PARTICIPANT SURVEY FORM:", err);
        req.session.flashMessage = { type: 'error', text: 'Error loading survey form due to internal error.' };
        // Redirect back to the event list if something fails unexpectedly
        return res.redirect(`/events/${occurrence ? occurrence.event_id : ''}`); 
    }
});


/* ============================================================
   PARTICIPANT SUBMISSION ROUTE (Self-Service POST) - FIXED FOR SILENT FAILURE
   POST /surveys/submit/:id (where :id is event_occurrence_id)
============================================================ */
router.post("/submit/:id", requireLogin, async (req, res) => {
    const occurrenceId = req.params.id;
    const participantId = req.session.userID; 
    
    // Determine redirect URL
    const redirectUrl = `/eventOccurrences/${occurrenceId}`;
    
    try {
        // 1. Double-check eligibility (CRITICAL FOR SECURITY)
        const hasAttended = await Registrations.checkIfAttended(occurrenceId, participantId);
        const hasSubmitted = await Surveys.checkIfSubmitted(occurrenceId, participantId);
        
        if (!hasAttended || hasSubmitted) {
            req.session.flashMessage = { type: 'error', text: 'Submission blocked: Eligibility failed (already submitted or did not attend).' };
            return res.redirect(redirectUrl);
        }

        // 2. DATA PROCESSING & ROBUST VALIDATION
        const requiredScoreFields = [
            'SurveySatisfactionScore', 'SurveyUsefulnessScore', 
            'SurveyRecommendationScore', 'SurveyInstructorScore'
        ];
        
        const scores = {};
        let validationFailed = false;

        for (const field of requiredScoreFields) {
            const scoreStr = req.body[field];
            const num = parseInt(scoreStr);
            
            // Check 1: Must be provided (required field check)
            // Check 2: Must be a number between 1 and 5
            if (!scoreStr || isNaN(num) || num < 1 || num > 5) {
                validationFailed = true;
                break;
            }
            scores[field] = num;
        }

        if (validationFailed) {
            req.session.flashMessage = { type: 'error', text: 'Submission failed: Please enter valid scores (1-5) for all required fields.' };
            return res.redirect(redirectUrl);
        }
        
        const { SurveySatisfactionScore, SurveyUsefulnessScore, SurveyRecommendationScore, SurveyInstructorScore } = scores;
        
        const overall = (SurveySatisfactionScore + SurveyUsefulnessScore + SurveyRecommendationScore + SurveyInstructorScore) / 4; 

        // 3. CREATE SURVEY
        const newSurvey = {
            event_occurrence_id: Number(occurrenceId),
            participant_id: Number(participantId), 
            satisfaction_score: SurveySatisfactionScore,
            usefulness_score: SurveyUsefulnessScore,
            recommendation_score: SurveyRecommendationScore,
            instructor_score: SurveyInstructorScore, 
            overall_score: overall.toFixed(2), 
            comments: req.body.SurveyComments,
            submission_date: new Date() 
        };

        await Surveys.create(newSurvey);
        
        req.session.flashMessage = { type: 'success', text: 'Thank you! Your survey has been submitted.' };
        return res.redirect(redirectUrl); 

    } catch (err) {
        console.error("CRITICAL SERVER CRASH IN PARTICIPANT SURVEY SUBMISSION:", err);
        req.session.flashMessage = { type: 'error', text: 'Submission failed due to a fatal server error.' };
        return res.redirect(redirectUrl);
    }
});


/* ============================================================
   NEW SURVEY (ADMIN ONLY) - UPDATED FOR CALCULATION
============================================================ */
router.get("/new", requireAdmin, async (req, res) => {
    try {
        const participants = await Participants.getAll();
        const occurrences = await EventOccurrences.getAll();

        res.render("surveys/new", {
            title: "New Survey (Admin)",
            participants,
            occurrences,
            session: req.session,
            selectedEvent: req.query.event_occurrence_id
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading form");
    }
});

router.post("/new", requireAdmin, async (req, res) => {
    try {
        // --- Parse scores as Integers ---
        const sat = parseInt(req.body.SurveySatisfactionScore);
        const use = parseInt(req.body.SurveyUsefulnessScore);
        const rec = parseInt(req.body.SurveyRecommendationScore);
        const instr = parseInt(req.body.SurveyInstructorScore); // New Field
        
        // Calculate average of 4 scores
        const overall = (sat + use + rec + instr) / 4; 

        const newSurvey = {
            event_occurrence_id: Number(req.body.EventOccurrenceID),
            participant_id: Number(req.body.ParticipantID),
            satisfaction_score: sat,
            usefulness_score: use,
            recommendation_score: rec,
            instructor_score: instr, // NEW FIELD
            overall_score: overall.toFixed(2), // Calculated Field
            comments: req.body.SurveyComments,
            submission_date: req.body.SurveySubmissionDate || new Date()
        };

        await Surveys.create(newSurvey);
        res.redirect(`/surveys/occurrence/${newSurvey.event_occurrence_id}`);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error creating survey");
    }
});

/* ============================================================
   EDIT SURVEY (ADMIN ONLY)
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
            occurrences,
            session: req.session
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading edit form");
    }
});

router.post("/:oid/:pid/edit", requireAdmin, async (req, res) => {
    try {
        // --- Parse scores as Integers ---
        const sat = parseInt(req.body.SurveySatisfactionScore);
        const use = parseInt(req.body.SurveyUsefulnessScore);
        const rec = parseInt(req.body.SurveyRecommendationScore);
        const instr = parseInt(req.body.SurveyInstructorScore); // New Field
        
        // Calculate average of 4 scores
        const overall = (sat + use + rec + instr) / 4; 

        const updates = {
            satisfaction_score: sat,
            usefulness_score: use,
            recommendation_score: rec,
            instructor_score: instr, // NEW FIELD
            overall_score: overall.toFixed(2), // Calculated Field
            comments: req.body.SurveyComments,
            submission_date: req.body.SurveySubmissionDate
        };

        await Surveys.update(req.params.oid, req.params.pid, updates);
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
        res.redirect(`/surveys/occurrence/${req.params.oid}`);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting survey");
    }
});

/* ============================================================
   SHOW SINGLE SURVEY
============================================================ */
router.get("/:oid/:pid", requireLogin, async (req, res) => {
    try {
        const survey = await Surveys.getByIds(req.params.oid, req.params.pid);
        if (!survey) return res.status(404).send("Survey not found");

        res.render("surveys/show", {
            title: "Survey Details",
            survey,
            session: req.session
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading details");
    }
});

module.exports = router;