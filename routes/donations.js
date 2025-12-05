const express = require("express");
const router = express.Router();

const { requireAdmin, requireLogin } = require("../middleware/auth");
const Donations = require("../models/donations");
const Participants = require("../models/participants");

/* ============================================================
   PUBLIC DONATION FORM
============================================================ */
router.get("/new", async (req, res) => {
    try {
        const pendingDonation = req.session.pendingDonation || null;
        const user = req.session.user || null;

        res.render("donations/new", {
            title: "Make a Donation",
            user,
            pendingDonation
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading form");
    }
});

/* ============================================================
   SUBMIT DONATION
============================================================ */
router.post("/new", async (req, res) => {
    try {
        const { DonationAmount, DonationDate } = req.body;

        // Guest users must login — store donation intent
        if (!req.session.user) {
            req.session.pendingDonation = {
                amount: DonationAmount,
                date: DonationDate
            };

            return req.session.save(err => {
                if (err) console.error(err);
                return res.redirect("/auth/login");
            });
        }

        // Logged-in participant
        const participantId = req.session.user.participant_id;

        const donation = {
            participant_id: participantId,
            donation_date: DonationDate,
            amount: Number(DonationAmount)
        };

        await Donations.create(donation);

        if (req.session.pendingDonation) {
            delete req.session.pendingDonation;
        }

        return res.redirect("/donations/thanks");

    } catch (err) {
        console.error(err);
        res.status(500).send("Error processing donation");
    }
});

/* ============================================================
   THANK-YOU PAGE
============================================================ */
router.get("/thanks", (req, res) => {
    res.render("donations/thanks", { title: "Thank You!" });
});

/* ============================================================
   DONATION LIST (ADMIN ONLY)
============================================================ */
router.get("/", requireAdmin, async (req, res) => {
    try {
        const query = req.query.q || "";
        const donations = await Donations.getAll(query);

        res.render("donations/index", {
            title: "Donations",
            donations,
            query
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Database Error");
    }
});

/* ============================================================
   SHOW DONATION (OWNER OR ADMIN ONLY)
============================================================ */
router.get("/:pid/:dno", requireLogin, async (req, res) => {
    try {
        const role = (req.session.access_level || "").toLowerCase();
        const isManager = role === "manager" || role === "admin";

        // FIXED BUG: must use user_id, not userID
        const isOwner = String(req.session.user_id) === String(req.params.pid);

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
   EDIT DONATION (ADMIN ONLY)
============================================================ */
router.get("/:pid/:dno/edit", requireAdmin, async (req, res) => {
    try {
        const donation = await Donations.getById(req.params.pid, req.params.dno);
        if (!donation) return res.status(404).send("Donation not found");

        const participants = await Participants.getAll();

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

/* ============================================================
   UPDATE DONATION (ADMIN)
============================================================ */
router.post("/:pid/:dno/edit", requireAdmin, async (req, res) => {
    try {
        const updates = {
            donation_date: req.body.DonationDate,
            amount: Number(req.body.DonationAmount)
        };

        await Donations.update(req.params.pid, req.params.dno, updates);

        return res.redirect("/donations");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating donation");
    }
});

/* ============================================================
   DELETE DONATION (ADMIN)
============================================================ */
router.post("/:pid/:dno/delete", requireAdmin, async (req, res) => {
    try {
        await Donations.delete(req.params.pid, req.params.dno);
        return res.redirect("/donations");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting donation");
    }
});

module.exports = router;
