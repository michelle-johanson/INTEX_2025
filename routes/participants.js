// routes/participants.js

const express = require("express");
const router = express.Router();

const { requireAdmin, requireLogin } = require("../middleware/auth");
const Participants = require("../models/participants");

/* ============================================================
   LIST PARTICIPANTS (LOGIN REQUIRED)
============================================================ */
router.get("/", requireLogin, async (req, res) => {
    try {
        const participants = await Participants.getAll();
        
        res.render("participants/index", {
            title: "Participants",
            participants
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Database Error");
    }
});


/* ============================================================
   CREATE NEW PARTICIPANT (ADMIN ONLY)
============================================================ */

// Show form
router.get("/new", requireAdmin, (req, res) => {
    res.render("participants/new", {
        title: "Add Participant"
    });
});

// Handle form submit
router.post("/new", requireAdmin, async (req, res) => {
    try {
        // Map Form Names -> Database Column Names
        const newParticipant = {
            email: req.body.Email,
            first_name: req.body.FirstName,
            last_name: req.body.LastName,
            dob: req.body.DOB || null, // Handle empty date strings
            role: req.body.Role,
            phone: req.body.Phone,
            city: req.body.City,
            state: req.body.State,
            zip: req.body.Zip,
            school_or_employer: req.body.SchoolOrEmployment,
            field_of_interest: req.body.FieldOfInterest
            // Note: We do NOT insert 'TotalDonations' here. 
            // That is calculated from the 'donations' table.
        };

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

// Show edit form
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

// Handle edit submit
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
        // Check for Foreign Key issues (e.g. if they have donations/registrations)
        if (err.code === '23503') {
            return res.status(400).send("Cannot delete participant: They have associated records (donations, registrations, etc).");
        }
        console.error(err);
        res.status(500).send("Error deleting participant");
    }
});


/* ============================================================
   SHOW SINGLE PARTICIPANT (LOGIN REQUIRED)
============================================================ */
router.get("/:id", requireLogin, async (req, res) => {
    try {
        const participant = await Participants.getById(req.params.id);
        
        if (!participant) return res.status(404).send("Participant not found");

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