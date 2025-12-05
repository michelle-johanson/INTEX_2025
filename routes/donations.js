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

        if (!req.session.user) {
            req.session.pendingDonation = {
                amount: DonationAmount,
                date: DonationDate
            };
            
            return req.session.save(err => {
                if (err) console.error(err);
                res.redirect("/auth/login");
            });
        }

        const participantId = req.session.user.participant_id;

        const newDonation = {
            participant_id: participantId,
            donation_date: DonationDate,
            amount: Number(DonationAmount)
        };

        await Donations.create(newDonation);

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
   INTERNAL PAGES (Restricted Access)
============================================================ */

// FIX: Changed from requireLogin to requireAdmin
// Only Admins/Managers should see the full list of ALL donations.
router.get("/", requireAdmin, async (req, res) => {
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
   SHOW DONATION (LOGIN REQUIRED + OWNER CHECK)
   URL: /donations/:pid/:dno
============================================================ */
router.get("/:pid/:dno", requireLogin, async (req, res) => {
    try {
        // FIX: Security Check
        // Ensure user is Admin OR the owner of the donation record
        const role = (req.session.access_level || "").toLowerCase();
        const isManager = role === 'manager' || role === 'admin';
        const isOwner = String(req.session.userID) === String(req.params.pid);

        if (!isManager && !isOwner) {
            return res.status(403).send("Unauthorized Access: You can only view your own donations.");
        }

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
        
        // FIX: Redirect logic based on role
        // Admins go to list; Participants (if we allowed them to edit, which we don't here) go to profile.
        // Since this is requireAdmin, sending to /donations list is correct.
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