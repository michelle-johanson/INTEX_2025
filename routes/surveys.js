const express = require("express");
const router = express.Router();
const { requireAdmin, requireLogin } = require("../middleware/auth");

const Surveys = require("../models/surveys");
const Events = require("../models/events");
const EventOccurrences = require("../models/eventOccurrences");
const Participants = require("../models/participants");
const Registrations = require("../models/registrations");

/* GET /surveys — manager: event types | participant: own surveys */
router.get("/", requireLogin, async (req, res) => {
    try {
        const roleRaw =
            req.session.access_level ||
            req.session.role ||
            (req.session.user && (req.session.user.access_level || req.session.user.role)) ||
            "";
        const role = roleRaw.toLowerCase();
        const isManager = role === "manager" || role === "admin";

        const q = req.query.q || "";

        if (isManager) {
            const events = await Events.getAll(q);
            return res.render("surveys/manager_index", {
                title: "Survey Reports - Select Event Type",
                mode: "types",
                data: events,
                q,
                session: req.session
            });
        }

        const participantId =
            (req.session.user && req.session.user.participant_id) ||
            req.session.participant_id ||
            req.session.user_id;

        if (!participantId) {
            console.error("Error: No participant ID found in session.");
            return res.status(500).send("Internal error: No participant ID found.");
        }

        const mySurveys = await Surveys.getByParticipant(participantId);

        res.render("surveys/index", {
            title: "My Surveys",
            surveys: mySurveys,
            contextName: "My",
            session: req.session,
            query: ""
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Database Error");
    }
});

/* GET /surveys/type/:id — manager: list occurrences for an event */
router.get("/type/:id", requireLogin, async (req, res) => {
    try {
        const event = await Events.getById(req.params.id);
        if (!event) return res.status(404).send("Event not found");

        const query = req.query.q || "";

        const occurrences = await EventOccurrences.getByEventId(req.params.id, query);


        res.render("surveys/manager_index", {
            title,
            mode,
            data,
            event,
            occurrences,
            q
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading occurrences");
    }
});

/* GET /surveys/occurrence/:id — manager: list surveys for occurrence */
router.get("/occurrence/:id", requireLogin, async (req, res) => {
    try {
        const occurrenceId = req.params.id;
        const query = req.query.q || "";

        const surveys = await Surveys.getByOccurrence(occurrenceId, query);
        const occurrence = await EventOccurrences.getById(occurrenceId) || {};

        const contextName = occurrence.event_name || `Occurrence ${occurrenceId}`;

        res.render("surveys/index", {
            title: `Results: ${contextName}`,
            contextName,
            surveys,
            occurrence,
            query,
            session: req.session
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading event surveys");
    }
});

/* GET /surveys/submit/:id — participant survey form */
router.get("/submit/:id", requireLogin, async (req, res) => {
    const occurrenceId = req.params.id;
    const participantId = req.session.user_id;
    const redirectUrl = `/eventOccurrences/${occurrenceId}`;

    try {
        const role = (req.session.access_level || "").toLowerCase();
        if (role === "manager" || role === "admin") {
            return res.redirect(`/surveys/new?event_occurrence_id=${occurrenceId}`);
        }

        const hasAttended = await Registrations.checkIfAttended(occurrenceId, participantId);
        const hasSubmitted = await Surveys.checkIfSubmitted(occurrenceId, participantId);
        const occurrence = await EventOccurrences.getById(occurrenceId);

        if (!occurrence) {
            req.session.flashMessage = { type: "error", text: "Event not found." };
            return res.redirect("/events");
        }

        if (!hasAttended) {
            req.session.flashMessage = {
                type: "error",
                text: "You must have attended the event to submit a survey."
            };
            return res.redirect(redirectUrl);
        }

        if (hasSubmitted) {
            req.session.flashMessage = {
                type: "warning",
                text: "You have already submitted a survey for this event."
            };
            return res.redirect(redirectUrl);
        }

        const participant = await Participants.getById(participantId);

        res.render("surveys/participant_new", {
            title: `Submit Survey for ${occurrence.event_name}`,
            occurrence,
            participant,
            participantId,
            errors: {},
            formData: {}
        });

    } catch (err) {
        console.error("Error loading survey form:", err);
        req.session.flashMessage = {
            type: "error",
            text: "Error loading survey form."
        };
        return res.redirect(redirectUrl);
    }
});

/* POST /surveys/submit/:id — participant submission */
router.post("/submit/:id", requireLogin, async (req, res) => {
    const occurrenceId = req.params.id;
    const participantId = req.session.user_id;
    const redirectUrl = `/eventOccurrences/${occurrenceId}`;

    try {
        const hasAttended = await Registrations.checkIfAttended(occurrenceId, participantId);
        const hasSubmitted = await Surveys.checkIfSubmitted(occurrenceId, participantId);

        if (!hasAttended || hasSubmitted) {
            req.session.flashMessage = {
                type: "error",
                text: "Submission blocked (not attended or already submitted)."
            };
            return res.redirect(redirectUrl);
        }

        const requiredFields = [
            "SurveySatisfactionScore",
            "SurveyUsefulnessScore",
            "SurveyRecommendationScore",
            "SurveyInstructorScore"
        ];

        const scores = {};
        let invalid = false;

        for (const field of requiredFields) {
            const num = parseInt(req.body[field]);
            if (!num || num < 1 || num > 5) {
                invalid = true;
                break;
            }
            scores[field] = num;
        }

        if (invalid) {
            req.session.flashMessage = {
                type: "error",
                text: "All scores must be numbers from 1 to 5."
            };
            return res.redirect(redirectUrl);
        }

        const { SurveySatisfactionScore, SurveyUsefulnessScore, SurveyRecommendationScore, SurveyInstructorScore } = scores;

        const overall =
            (SurveySatisfactionScore +
                SurveyUsefulnessScore +
                SurveyRecommendationScore +
                SurveyInstructorScore) / 4;

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

        req.session.flashMessage = {
            type: "success",
            text: "Thank you! Your survey has been submitted."
        };

        return res.redirect(redirectUrl);

    } catch (err) {
        console.error("Survey submission error:", err);
        req.session.flashMessage = {
            type: "error",
            text: "A server error occurred."
        };
        return res.redirect(redirectUrl);
    }
});

/* GET /surveys/new — admin create form */
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

/* POST /surveys/new — admin creation */
router.post("/new", requireAdmin, async (req, res) => {
    try {
        const sat = parseInt(req.body.SurveySatisfactionScore);
        const use = parseInt(req.body.SurveyUsefulnessScore);
        const rec = parseInt(req.body.SurveyRecommendationScore);
        const instr = parseInt(req.body.SurveyInstructorScore);

        const overall = (sat + use + rec + instr) / 4;

        const newSurvey = {
            event_occurrence_id: Number(req.body.EventOccurrenceID),
            participant_id: Number(req.body.ParticipantID),
            satisfaction_score: sat,
            usefulness_score: use,
            recommendation_score: rec,
            instructor_score: instr,
            overall_score: overall.toFixed(2),
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

/* GET /surveys/:oid/:pid/edit — admin edit */
router.get("/:oid/:pid/edit", requireAdmin, async (req, res) => {
    try {
        const survey = await Surveys.getByIds(req.params.oid, req.params.pid);
        if (!survey) return res.status(404).send("Survey not found");

        const participants = await Participants.getAll();
        const occurrences = await EventOccurrences.getAll();

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

/* POST /surveys/:oid/:pid/edit — update survey */
router.post("/:oid/:pid/edit", requireAdmin, async (req, res) => {
    try {
        const sat = parseInt(req.body.SurveySatisfactionScore);
        const use = parseInt(req.body.SurveyUsefulnessScore);
        const rec = parseInt(req.body.SurveyRecommendationScore);
        const instr = parseInt(req.body.SurveyInstructorScore);

        const overall = (sat + use + rec + instr) / 4;

        const updates = {
            satisfaction_score: sat,
            usefulness_score: use,
            recommendation_score: rec,
            instructor_score: instr,
            overall_score: overall.toFixed(2),
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

/* POST /surveys/:oid/:pid/delete — delete survey */
router.post("/:oid/:pid/delete", requireAdmin, async (req, res) => {
    try {
        await Surveys.delete(req.params.oid, req.params.pid);
        res.redirect(`/surveys/occurrence/${req.params.oid}`);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting survey");
    }
});

/* GET /surveys/:oid/:pid — show survey */
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
