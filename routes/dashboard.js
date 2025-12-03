const express = require("express");
const router = express.Router();

const { requireAdmin } = require("../middleware/auth");

const Participants = require("../models/participants");
const Donations = require("../models/donations");
const EventOccurrences = require("../models/eventOccurrences");

/* ============================================================
   DASHBOARD INDEX (ADMIN / MANAGER ONLY)
============================================================ */
router.get("/", requireAdmin, async (req, res) => {
    try {
        // Core program stats
        const [allParticipants, allDonations, allEvents] = await Promise.all([
            Participants.getAll(),
            Donations.getAll(),
            EventOccurrences.getAll()
        ]);

        const stats = {
            totalParticipants: allParticipants.length,
            totalRaised: allDonations.reduce((sum, d) => sum + Number(d.amount), 0),
            upcomingEvents: allEvents.filter(e => new Date(e.starts_at) > new Date()).length
        };

        // Filters + Tableau embed options from Jacob's version
        const eventTypes = ["Workshop", "Mentoring", "Activity", "STEAM Event"];
        const demographics = ["Middle School", "High School", "College", "Parent"];

        const selectedEvent = req.query.eventType || "";
        const selectedDemo = req.query.demo || "";

        const dashboardUrl = "https://public.tableau.com/views/YourEllaRisesDashboard";

        // Use the new single-file dashboard view
        res.render("dashboard", {
            title: "Program Dashboard",
            stats,
            eventTypes,
            demographics,
            selectedEvent,
            selectedDemo,
            dashboardUrl,
            session: req.session
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading dashboard");
    }
});

module.exports = router;
