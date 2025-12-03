// routes/participants.js

const express = require("express");
const router = express.Router();

const { requireAdmin, requireLogin } = require("../middleware/auth");
const Participants = require("../models/participants");

/* ============================================================
   LIST PARTICIPANTS (SPLIT LOGIC)
============================================================ */
router.get("/", requireLogin, async (req, res) => {
    try {
        const role = (req.session.access_level || "").toLowerCase();

        // SCENARIO 1: MANAGER - Show Directory
        if (role === "manager" || role === "admin") {
            const participants = await Participants.getAll();
            return res.render("participants/index", {
                title: "Participant Directory",
                participants
            });
        }

        // SCENARIO 2: PARTICIPANT - Redirect to Profile
        res.redirect(`/participants/${req.session.userID}`);

    } catch (err) {
        console.error(err);
        res.status(500).send("Database Error");
    }
});


/* ============================================================
   CREATE NEW PARTICIPANT (ADMIN ONLY)
============================================================ */

router.get("/new", requireAdmin, (req, res) => {
    res.render("participants/new", {
        title: "Add Participant"
    });
});

// Handle form submit
router.post("/new", requireAdmin, async (req, res) => {
    try {
        const newParticipant = {
            email: req.body.Email,
            // FIX 1: Capture the password from the form
            password: req.body.Password, 
            
            first_name: req.body.FirstName,
            last_name: req.body.LastName,
            dob: req.body.DOB || null,
            
            // FIX 2: Hardcode role (since we removed the input from the form)
            role: "participant", 
            
            phone: req.body.Phone,
            city: req.body.City,
            state: req.body.State,
            zip: req.body.Zip,
            school_or_employer: req.body.SchoolOrEmployment,
            field_of_interest: req.body.FieldOfInterest
        };

        // The Model uses 'returning participant_id', allowing us to grab the new ID
        await Participants.create(newParticipant);
        
        res.redirect("/participants");

    } catch (err) {
        console.error(err);
        res.status(500).send("Error creating participant");
    }
});


/* ============================================================
   EDIT PARTICIPANT (ADMIN ONLY)
============================================================ */

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


/* ============================================================
   DELETE PARTICIPANT (ADMIN ONLY)
============================================================ */
router.post("/:id/delete", requireAdmin, async (req, res) => {
    try {
        await Participants.delete(req.params.id);
        res.redirect("/participants");
    } catch (err) {
        if (err.code === '23503') {
            return res.status(400).send("Cannot delete participant: They have associated records.");
        }
        console.error(err);
        res.status(500).send("Error deleting participant");
    }
});


/* ============================================================
   SHOW SINGLE PARTICIPANT (PROFILE)
============================================================ */
router.get("/:id", requireLogin, async (req, res) => {
    try {
        const participant = await Participants.getById(req.params.id);
        
        if (!participant) return res.status(404).send("Participant not found");

        // Security Check
        const role = (req.session.access_level || "").toLowerCase();
        const isAuthorized = (role === 'manager' || role === 'admin') || 
                             (String(req.session.userID) === String(participant.participant_id));

        if (!isAuthorized) {
            return res.status(403).send("Unauthorized Access");
        }

        res.render("participants/show", {
            title: "Participant Details",
            participant
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading details");
    }
});

module.exports = router;