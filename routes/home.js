// routes/home.js

const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
    res.render("home", {
        title: "Ella Rises – Empowering Young Women",
        // UPDATED: 'Username' -> 'username' (to match auth.js)
        username: req.session.username || null 
    });
});

module.exports = router;