const express = require('express');
const router = express.Router();
const { requireLogin } = require('../middleware/auth');

router.get('/', requireLogin, async (req, res) => {
    try {
        const eventTypes = ["Workshop", "Mentoring", "Activity", "STEAM Event"];
        const demographics = ["Middle School", "High School", "College", "Parent"];

        const selectedEvent = req.query.eventType || "";
        const selectedDemo = req.query.demo || "";

        const dashboardUrl = "https://public.tableau.com/views/YourEllaRisesDashboard";

        res.render('dashboard', {
            title: "Dashboard",
            eventTypes,
            demographics,
            selectedEvent,
            selectedDemo,
            dashboardUrl
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error loading dashboard");
    }
});

module.exports = router;
