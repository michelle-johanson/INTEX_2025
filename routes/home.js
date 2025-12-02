// routes/home.js

const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
    res.render("home", {
        title: "Ella Rises – Empowering Young Women",
        isLoggedIn: req.session.isLoggedIn || false,
        username: req.session.Username || null
    });
});

module.exports = router;
