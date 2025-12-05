const express = require("express");
const router = express.Router();

const { requireAdmin, requireLogin } = require("../middleware/auth");
const Donations = require("../models/donations");
const Participants = require("../models/participants");

/* GET /donations/new — public donation form */
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

/* POST /donations/new — submit donation */
router.post("/new", async (req, res) => {
    try {
        const { DonationAmount, DonationDate } = req.body;

        // Guest users are redirected to login
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

        res.redirect("/donations/thanks");

    } catch (err) {
        console.error(err);
        res.status(500).send("Error processing donation");
    }
});

/* GET /donations/thanks — thank-you page */
router.get("/thanks", (req, res) => {
    res.render("donations/thanks", { title: "Thank You!" });
});

/* GET /donations — list donations (search supported) */
router.get("/", requireLogin, async (req, res) => {
    try {
        const query = req.query.q || "";  // unified search param
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

/* GET /donations/:pid/:dno — show a donation */
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

/* GET /donations/:pid/:dno/edit — manager edit form */
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

/* POST /donations/:pid/:dno/edit — update donation */
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

/* POST /donations/:pid/:dno/delete — delete donation */
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
