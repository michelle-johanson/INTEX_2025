const express = require("express");
const router = express.Router();

const { requireAdmin, requireLogin } = require("../middleware/auth");
const Participants = require("../models/participants");
const Registrations = require("../models/registrations");

/* GET /participants — list participants (supports search for managers) */
router.get("/", requireLogin, async (req, res) => {
    try {
        const role = (req.session.access_level || "").toLowerCase();
        const query = req.query.q || "";

        // Managers/Admins see the full directory
        if (role === "manager" || role === "admin") {
            const participants = await Participants.getAll(query);
            return res.render("participants/index", {
                title: "Participant Directory",
                participants,
                query
            });
        }

        // Participants get redirected to their own profile
        res.redirect(`/participants/${req.session.user_id}`);

    } catch (err) {
        console.error(err);
        res.status(500).send("Database Error");
    }
});

/* GET /participants/new — new participant form (admin only) */
router.get("/new", requireAdmin, (req, res) => {
    res.render("participants/new", {
        title: "Add Participant"
    });
});

/* POST /participants/new — create participant (admin only) */
router.post("/new", requireAdmin, async (req, res) => {
    try {
        const newParticipant = {
            email: req.body.Email,
            password: req.body.Password,
            first_name: req.body.FirstName,
            last_name: req.body.LastName,
            dob: req.body.DOB || null,
            role: "participant",
            phone: req.body.Phone,
            city: req.body.City,
            state: req.body.State,
            zip: req.body.Zip,
            school_or_employer: req.body.SchoolOrEmployment,
            field_of_interest: req.body.FieldOfInterest
        };

        await Participants.create(newParticipant);
        res.redirect("/participants");

    } catch (err) {
        console.error(err);
        res.status(500).send("Error creating participant");
    }
});

/* GET /participants/:id/edit — edit form (admin only) */
router.get("/:id/edit", requireAdmin, async (req, res) => {
    try {
        const participant = await Participants.getById(req.params.id);
        if (!participant) return res.status(404).send("Participant not found");

        res.render("participants/edit", {
            title: "Edit Participant",
            participant
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching participant");
    }
});

/* POST /participants/:id/edit — update participant (admin only) */
router.post("/:id/edit", requireAdmin, async (req, res) => {
    try {
        const updates = {
            email: req.body.Email,
            first_name: req.body.FirstName,
            last_name: req.body.LastName,
            dob: req.body.DOB || null,
            role: req.body.Role,
            phone: req.body.Phone,
            city: req.body.City,
            state: req.body.State,
            zip: req.body.Zip,
            school_or_employer: req.body.SchoolOrEmployment,
            field_of_interest: req.body.FieldOfInterest
        };

        await Participants.update(req.params.id, updates);
        res.redirect("/participants");

    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating participant");
    }
});

/* POST /participants/:id/delete — delete participant (admin only) */
router.post("/:id/delete", requireAdmin, async (req, res) => {
    try {
        await Participants.delete(req.params.id);
        res.redirect("/participants");

    } catch (err) {
        if (err.code === "23503") {
            return res.status(400).send("Cannot delete participant: They have associated records.");
        }
        console.error(err);
        res.status(500).send("Error deleting participant");
    }
});

/* GET /participants/:id — view participant profile */
router.get("/:id", requireLogin, async (req, res) => {
    try {
        const participantId = req.params.id;
        const participant = await Participants.getById(participantId);
        if (!participant) return res.status(404).send("Participant not found");

        const registeredEvents = await Registrations.getByParticipant(participantId);

        const role = (req.session.access_level || "").toLowerCase();
        const isAuthorized =
            role === "manager" ||
            role === "admin" ||
            String(req.session.user_id) === String(participant.participant_id);

        if (!isAuthorized) {
            return res.status(403).send("Unauthorized Access");
        }

        res.render("participants/show", {
            title: "Participant Details",
            participant,
            registeredEvents
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading details");
    }
});

module.exports = router;
