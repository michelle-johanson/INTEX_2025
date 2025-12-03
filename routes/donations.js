const express = require("express");
const router = express.Router();

const { requireAdmin, requireLogin } = require("../middleware/auth");
const Donations = require("../models/donations");
const Participants = require("../models/participants");

/* ============================================================
   PUBLIC DONATION FORM (NO LOGIN REQUIRED)
============================================================ */

// Show donation form
router.get("/new", async (req, res) => {
    try {
        // We need participants for the dropdown selection
        const participants = await Participants.getAll();
        
        res.render("donations/new", {
            title: "Make a Donation",
            participants
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading form");
    }
});

// Submit new donation
router.post("/new", async (req, res) => {
    try {
        const newDonation = {
            participant_id: Number(req.body.ParticipantID),
            donation_date: req.body.DonationDate,
            amount: Number(req.body.DonationAmount)
        };

        await Donations.create(newDonation);
        res.redirect("/donations/thanks");

    } catch (err) {
        console.error(err);
        res.status(500).send("Error processing donation");
    }
});

// Thank-you page
router.get("/thanks", (req, res) => {
    res.render("donations/thanks", { title: "Thank You!" });
});


/* ============================================================
   INTERNAL PAGES (LOGIN REQUIRED)
============================================================ */

router.get("/", requireLogin, async (req, res) => {
    try {
        // 1. Capture search term
        const searchTerm = req.query.search || "";

        // 2. Pass search term to the Model
        const donations = await Donations.getAll(searchTerm);
        
        res.render("donations/index", {
            title: "Donations",
            donations,
            searchTerm // 3. Send back to view to keep input filled
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Database Error");
    }
});


/* ============================================================
   SHOW DONATION (LOGIN REQUIRED)
   URL: /donations/:pid/:dno
============================================================ */
router.get("/:pid/:dno", requireLogin, async (req, res) => {
    try {
        const donation = await Donations.getById(req.params.pid, req.params.dno);

        if (!donation) return res.status(404).send("Donation not found");

        res.render("donations/show", {
            title: "Donation Details",
            donation
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading details");
    }
});


/* ============================================================
   MANAGER-ONLY ACTIONS
   URL: /donations/:pid/:dno/edit
============================================================ */

// Show edit form
router.get("/:pid/:dno/edit", requireAdmin, async (req, res) => {
    try {
        const donation = await Donations.getById(req.params.pid, req.params.dno);
        const participants = await Participants.getAll();

        if (!donation) return res.status(404).send("Donation not found");

        res.render("donations/edit", {
            title: "Edit Donation",
            donation,
            participants
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading edit form");
    }
});

// Submit edits
router.post("/:pid/:dno/edit", requireAdmin, async (req, res) => {
    try {
        const updates = {
            donation_date: req.body.DonationDate,
            amount: Number(req.body.DonationAmount)
        };

        await Donations.update(req.params.pid, req.params.dno, updates);
        res.redirect("/donations");

    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating donation");
    }
});

// Delete a donation
router.post("/:pid/:dno/delete", requireAdmin, async (req, res) => {
    try {
        await Donations.delete(req.params.pid, req.params.dno);
        res.redirect("/donations");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting donation");
    }
});

module.exports = router;