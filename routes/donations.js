const express = require("express");
const router = express.Router();

// TEMP IN-MEMORY DATA (replace with DB later)
let donations = [
    { id: 1, donor: "Jane Doe", amount: 50, message: "Love this mission!" },
    { id: 2, donor: "Anonymous", amount: 20, message: "" }
];

// ===========================
// PUBLIC DONATION FORM
// ===========================
router.get("/new", (req, res) => {
    res.render("donations/new", { title: "Make a Donation" });
});

router.post("/new", (req, res) => {
    const { donor, amount, message } = req.body;

    donations.push({
        id: donations.length + 1,
        donor,
        amount: Number(amount),
        message
    });

    res.redirect("/donations/thanks");
});

// Thank-you + optional Givebutter redirect
router.get("/thanks", (req, res) => {
    res.render("donations/thanks", { title: "Thank You!" });
});

// ===========================
// MANAGER / INTERNAL PAGES
// ===========================

// List all donations
router.get("/", (req, res) => {
    res.render("donations/index", {
        title: "Donations",
        donations
    });
});

// Show one donation (detail page)
router.get("/:id", (req, res) => {
    const donation = donations.find(d => d.id == req.params.id);
    res.render("donations/show", { title: "Donation Details", donation });
});

// Edit donation
router.get("/:id/edit", (req, res) => {
    const donation = donations.find(d => d.id == req.params.id);
    res.render("donations/edit", { title: "Edit Donation", donation });
});

router.post("/:id/edit", (req, res) => {
    const donation = donations.find(d => d.id == req.params.id);
    donation.donor = req.body.donor;
    donation.amount = Number(req.body.amount);
    donation.message = req.body.message;
    res.redirect("/donations");
});

// Delete donation
router.post("/:id/delete", (req, res) => {
    donations = donations.filter(d => d.id != req.params.id);
    res.redirect("/donations");
});

module.exports = router;
