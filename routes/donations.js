// routes/donations.js

const express = require("express");
const router = express.Router();

const { requireAdmin, requireLogin } = require("../middleware/auth");

const Donations = require("../models/donations");     // NEW MODEL NAME
const Participants = require("../models/participants");

/* ============================================================
    PUBLIC DONATION FORM (NO LOGIN REQUIRED)
============================================================ */

// Show donation form
router.get("/new", (req, res) => {
    res.render("donations/new", {
        title: "Make a Donation",
        participants: Participants.getAll()   // so the donor can pick a participant
    });
});

// Submit new donation
router.post("/new", (req, res) => {
    Donations.create({
        ParticipantID: Number(req.body.ParticipantID),
        DonationDate: req.body.DonationDate,
        DonationAmount: Number(req.body.DonationAmount)
    });

    res.redirect("/donations/thanks");
});

// Thank-you page
router.get("/thanks", (req, res) => {
    res.render("donations/thanks", { title: "Thank You!" });
});


/* ============================================================
    INTERNAL PAGES (LOGIN REQUIRED)
============================================================ */

router.get("/", requireLogin, (req, res) => {
    const donations = Donations.getAll();

    res.render("donations/index", {
        title: "Donations",
        donations,
        participants: Participants.getAll()
    });
});


/* ============================================================
    SHOW DONATION (LOGIN REQUIRED)
============================================================ */
router.get("/:id", requireLogin, (req, res) => {
    const donation = Donations.getById(req.params.id);

    if (!donation) return res.status(404).send("Donation not found");

    const participant = Participants.getById(donation.ParticipantID);

    res.render("donations/show", {
        title: "Donation Details",
        donation,
        participant
    });
});


/* ============================================================
    MANAGER-ONLY ACTIONS
============================================================ */

// Show edit form
router.get("/:id/edit", requireAdmin, (req, res) => {
    const donation = Donations.getById(req.params.id);
    if (!donation) return res.status(404).send("Donation not found");

    res.render("donations/edit", {
        title: "Edit Donation",
        donation,
        participants: Participants.getAll()
    });
});

// Submit edits
router.post("/:id/edit", requireAdmin, (req, res) => {
    Donations.update(req.params.id, {
        ParticipantID: Number(req.body.ParticipantID),
        DonationDate: req.body.DonationDate,
        DonationAmount: Number(req.body.DonationAmount)
    });

    res.redirect("/donations");
});

// Delete a donation
router.post("/:id/delete", requireAdmin, (req, res) => {
    Donations.delete(req.params.id);
    res.redirect("/donations");
});

module.exports = router;
