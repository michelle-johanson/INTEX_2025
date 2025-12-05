const express = require("express");
const router = express.Router();
const { requireAdmin } = require("../middleware/auth");

/* GET /users — redirect to maintenance dashboard */
router.get("/", requireAdmin, (req, res) => {
    res.redirect("/users/maintenance_index");
});

/* GET /users/maintenance_index — admin maintenance dashboard */
router.get("/maintenance_index", requireAdmin, (req, res) => {
    res.render("users/maintenance_index", {
        title: "User Maintenance Dashboard",
        session: req.session
    });
});

module.exports = router;
