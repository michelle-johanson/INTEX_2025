// routes/donations.js

const express = require("express");
const router = express.Router();

const { requireAdmin, requireLogin } = require("../middleware/auth");
const Donations = require("../models/fakeDonations");

/* ============================================================
    PUBLIC DONATION FORM (no login required)
============================================================ */

// Show donation form
router.get("/new", (req, res) => {
    res.render("donations/new", { title: "Make a Donation" });
});

// Submit new donation (public)
router.post("/new", (req, res) => {
    const { donor, amount, message } = req.body;

    Donations.add(donor, Number(amount), message);

    res.redirect("/donations/thanks");
});

// Thank-you page
router.get("/thanks", (req, res) => {
    res.render("donations/thanks", { title: "Thank You!" });
});


/* ============================================================
    INTERNAL PAGES (login required)
============================================================ */

// List all donations
router.get("/", (req, res) => {
    const donations = Donations.getAll();
    res.render("donations/index", {
        title: "Donations",
        donations
    });
});

// Show donation details
router.get("/:id", (req, res) => {
    const donation = Donations.getById(req.params.id);

    res.render("donations/show", {
        title: "Donation Details",
        donation
    });
});


/* ============================================================
    MANAGER-ONLY ACTIONS
============================================================ */

// Show edit form
router.get("/:id/edit", requireAdmin, (req, res) => {
    const donation = Donations.getById(req.params.id);

    res.render("donations/edit", {
        title: "Edit Donation",
        donation
    });
});

// Submit edits
router.post("/:id/edit", requireAdmin, (req, res) => {
    Donations.update(req.params.id, {
        donor: req.body.donor,
        amount: Number(req.body.amount),
        message: req.body.message
    });

    res.redirect("/donations");
});

// Delete a donation
router.post("/:id/delete", requireAdmin, (req, res) => {
    Donations.delete(req.params.id);
    res.redirect("/donations");
});

module.exports = router;
