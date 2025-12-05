const express = require("express");
const router = express.Router();

// REMOVED: const knex = ... (This was causing the error)
const { requireAdmin, requireLogin } = require("../middleware/auth");
const Donations = require("../models/donations");
const Participants = require("../models/participants");

/* ============================================================
   PUBLIC DONATION FORM (NO LOGIN REQUIRED)
============================================================ */

// Show donation form
router.get("/new", async (req, res) => {
    try {
        // Check for pending donation (from guest redirect)
        const pendingDonation = req.session.pendingDonation || null;
        const user = req.session.user || null;
        
        res.render("donations/new", {
            title: "Make a Donation",
            user: user,
            pendingDonation: pendingDonation
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading form");
    }
});

// Submit new donation
router.post("/new", async (req, res) => {
    try {
        const { DonationAmount, DonationDate } = req.body;

        // --- SCENARIO 1: GUEST USER (Not Logged In) ---
        if (!req.session.user) {
            req.session.pendingDonation = {
                amount: DonationAmount,
                date: DonationDate
            };
            
            return req.session.save(err => {
                if (err) console.error(err);
                res.redirect("/auth/login"); // Redirect to login/signup
            });
        }

        // --- SCENARIO 2: LOGGED IN USER ---
        const participantId = req.session.user.participant_id;

        // Build the object. We do NOT need to calculate donation_no here.
        // Your model's create() function handles that logic automatically.
        const newDonation = {
            participant_id: participantId,
            donation_date: DonationDate,
            amount: Number(DonationAmount)
        };

        await Donations.create(newDonation);

        // Clear pending donation from session if it existed
        if (req.session.pendingDonation) {
            delete req.session.pendingDonation;
        }

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
        const searchTerm = req.query.search || "";
        const donations = await Donations.getAll(searchTerm);
        
        res.render("donations/index", {
            title: "Donations",
            donations,
            searchTerm 
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
        // Participants list is only needed here if admin wants to change who donated (rare, but possible)
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