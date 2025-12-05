const express = require("express");
const router = express.Router();
const { requireAdmin, requireLogin } = require("../middleware/auth");

const Surveys = require("../models/surveys");
const Events = require("../models/events");
const EventOccurrences = require("../models/eventOccurrences");
const Participants = require("../models/participants");
const Registrations = require("../models/registrations");

/* ============================================================
   INDEX — MANAGER sees event types, PARTICIPANT sees own surveys
============================================================ */
router.get("/", requireLogin, async (req, res) => {
    try {
        const roleRaw =
            req.session.access_level ||
            (req.session.user && req.session.user.role) ||
            "";
        const role = roleRaw.toLowerCase();
        const isManager = role === "manager" || role === "admin";

        const q = req.query.q || "";

        // MANAGER VIEW — list of event types
        if (isManager) {
            const events = await Events.getAll(q);

            return res.render("surveys/manager_index", {
                title: "Survey Reports",
                mode: "types",
                data: events,
                event: null,
                q,
                session: req.session
            });
        }

        // PARTICIPANT VIEW — their own surveys
        const participantId =
            (req.session.user && req.session.user.participant_id) ||
            req.session.user_id;

        if (!participantId) {
            console.error("No participant id in session.");
            return res.status(500).send("Internal session error.");
        }

        const mySurveys = await Surveys.getByParticipant(participantId);

        return res.render("surveys/index", {
            title: "My Surveys",
            surveys: mySurveys,
            contextName: "My",
            session: req.session,
            q: ""
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Database Error");
    }
});


/* ============================================================
   TYPE VIEW — MANAGER sees list of occurrences for an event
============================================================ */
router.get("/type/:id", requireLogin, async (req, res) => {
    try {
        const q = req.query.q || "";

        const event = await Events.getById(req.params.id);
        if (!event) return res.status(404).send("Event not found");

        const occurrences = await EventOccurrences.getByEventId(
            req.params.id,
            q
        );

        return res.render("surveys/manager_index", {
            title: `Surveys for ${event.name}`,
            mode: "occurrences",
            data: occurrences,
            event,
            q,
            session: req.session
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading occurrences");
    }
});


/* ============================================================
   OCCURRENCE VIEW — MANAGER or PARTICIPANT sees all surveys
============================================================ */
router.get("/occurrence/:id", requireLogin, async (req, res) => {
    try {
        const occurrenceId = req.params.id;
        const q = req.query.q || "";

        const surveys = await Surveys.getByOccurrence(occurrenceId, q);
        const occurrence = await EventOccurrences.getById(occurrenceId);

        if (!occurrence) {
            return res.status(404).send("Occurrence not found");
        }

        const contextName = occurrence.event_name;

        return res.render("surveys/index", {
            title: `Results: ${contextName}`,
            contextName,
            surveys,
            occurrence,
            q,
            session: req.session
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading event surveys");
    }
});


/* ============================================================
   PARTICIPANT SURVEY SUBMISSION (self-service)
============================================================ */
router.get("/submit/:id", requireLogin, async (req, res) => {
    const occurrenceId = req.params.id;
    const participantId =
        (req.session.user && req.session.user.participant_id) ||
        req.session.user_id;

    const returnTo = req.query.returnTo || `/eventOccurrences/${occurrenceId}`;

    try {
        const role = (req.session.access_level || "").toLowerCase();
        if (role === "manager" || role === "admin") {
            return res.redirect(
                `/surveys/new?event_occurrence_id=${occurrenceId}`
            );
        }

        const hasAttended = await Registrations.checkIfAttended(
            occurrenceId,
            participantId
        );
        const hasSubmitted = await Surveys.checkIfSubmitted(
            occurrenceId,
            participantId
        );
        const occurrence = await EventOccurrences.getById(occurrenceId);

        if (!occurrence) {
            req.session.flashMessage = {
                type: "error",
                text: "Event not found."
            };
            return res.redirect(returnTo);
        }

        if (!hasAttended) {
            req.session.flashMessage = {
                type: "error",
                text: "You must have attended the event to submit a survey."
            };
            return res.redirect(returnTo);
        }

        if (hasSubmitted) {
            req.session.flashMessage = {
                type: "warning",
                text: "You have already submitted a survey for this event."
            };
            return res.redirect(returnTo);
        }

        const participant = await Participants.getById(participantId);

        return res.render("surveys/participant_new", {
            title: `Submit Survey for ${occurrence.event_name}`,
            occurrence,
            participant,
            participantId,
            errors: {},
            formData: {},
            returnTo
        });

    } catch (err) {
        console.error("Error loading survey form:", err);
        req.session.flashMessage = {
            type: "error",
            text: "Error loading form."
        };
        return res.redirect(returnTo);
    }
});


/* ============================================================
   POST — CREATE SURVEY (participant submission)
============================================================ */
router.post("/submit/:id", requireLogin, async (req, res) => {
    const occurrenceId = req.params.id;
    const participantId =
        (req.session.user && req.session.user.participant_id) ||
        req.session.user_id;

    const returnTo = req.body.returnTo || `/eventOccurrences/${occurrenceId}`;

    try {
        const hasAttended = await Registrations.checkIfAttended(
            occurrenceId,
            participantId
        );
        const hasSubmitted = await Surveys.checkIfSubmitted(
            occurrenceId,
            participantId
        );

        if (!hasAttended || hasSubmitted) {
            req.session.flashMessage = {
                type: "error",
                text: "Submission blocked: Eligibility failed."
            };
            return res.redirect(returnTo);
        }

        const required = [
            "SurveySatisfactionScore",
            "SurveyUsefulnessScore",
            "SurveyRecommendationScore",
            "SurveyInstructorScore"
        ];

        const errors = {};
        const scores = {};
        let invalid = false;

        for (const field of required) {
            const num = parseInt(req.body[field]);
            if (!num || num < 1 || num > 5) {
                invalid = true;
                errors[field] = "Please enter a valid score (1–5).";
            } else {
                scores[field] = num;
            }
        }

        if (invalid) {
            const occurrence = await EventOccurrences.getById(occurrenceId);
            const participant = await Participants.getById(participantId);

            return res.render("surveys/participant_new", {
                title: `Submit Survey for ${occurrence.event_name}`,
                occurrence,
                participant,
                participantId,
                errors,
                formData: req.body,
                returnTo
            });
        }

        const overall =
            (scores.SurveySatisfactionScore +
                scores.SurveyUsefulnessScore +
                scores.SurveyRecommendationScore +
                scores.SurveyInstructorScore) /
            4;

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

        req.session.flashMessage = {
            type: "success",
            text: "Thank you! Your survey has been submitted."
        };

        return res.redirect(returnTo);

    } catch (err) {
        console.error("SURVEY SUBMISSION ERROR:", err);
        req.session.flashMessage = {
            type: "error",
            text: "Server error submitting survey."
        };
        return res.redirect(returnTo);
    }
});


/* ============================================================
   ADMIN — NEW SURVEY FORM
============================================================ */
router.get("/new", requireAdmin, async (req, res) => {
    try {
        const participants = await Participants.getAll();
        const occurrences = await EventOccurrences.getAll();

        return res.render("surveys/new", {
            title: "New Survey",
            participants,
            occurrences,
            selectedEvent: req.query.event_occurrence_id,
            session: req.session
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading form");
    }
});


/* ============================================================
   ADMIN — CREATE SURVEY
============================================================ */
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

        return res.redirect(`/surveys/occurrence/${newSurvey.event_occurrence_id}`);

    } catch (err) {
        console.error(err);
        res.status(500).send("Error creating survey");
    }
});


/* ============================================================
   ADMIN — EDIT SURVEY FORM
============================================================ */
router.get("/:oid/:pid/edit", requireAdmin, async (req, res) => {
    try {
        const survey = await Surveys.getByIds(req.params.oid, req.params.pid);
        if (!survey) return res.status(404).send("Survey not found");

        const participants = await Participants.getAll();
        const occurrences = await EventOccurrences.getAll();

        return res.render("surveys/edit", {
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


/* ============================================================
   ADMIN — UPDATE SURVEY
============================================================ */
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

        return res.redirect(`/surveys/occurrence/${req.params.oid}`);

    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating survey");
    }
});


/* ============================================================
   ADMIN — DELETE SURVEY
============================================================ */
router.post("/:oid/:pid/delete", requireAdmin, async (req, res) => {
    try {
        await Surveys.delete(req.params.oid, req.params.pid);
        return res.redirect(`/surveys/occurrence/${req.params.oid}`);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting survey");
    }
});


/* ============================================================
   SHOW ONE SURVEY
============================================================ */
router.get("/:oid/:pid", requireLogin, async (req, res) => {
    try {
        const survey = await Surveys.getByIds(req.params.oid, req.params.pid);
        if (!survey) return res.status(404).send("Survey not found");

        return res.render("surveys/show", {
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
