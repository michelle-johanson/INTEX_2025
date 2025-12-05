const express = require("express");
const router = express.Router();
const { requireAdmin } = require("../middleware/auth");

const Participants = require("../models/participants");
const Donations = require("../models/donations");
const EventOccurrences = require("../models/eventOccurrences");

/* GET /dashboard — admin program dashboard */
router.get("/", requireAdmin, async (req, res) => {
    try {
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

        const eventTypes = ["Workshop", "Mentoring", "Activity", "STEAM Event"];
        const demographics = ["Middle School", "High School", "College", "Parent"];

        res.render("dashboard", {
            title: "Program Dashboard",
            stats,
            eventTypes,
            demographics,
            selectedEvent: req.query.eventType || "",
            selectedDemo: req.query.demo || "",
            dashboardUrl: "https://public.tableau.com/views/YourEllaRisesDashboard",
            session: req.session
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading dashboard");
    }
});

module.exports = router;
