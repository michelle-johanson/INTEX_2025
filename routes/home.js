// routes/home.js

const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
    
    // 1. Retrieve the message from the session (if it exists)
    const message = req.session.message || null;
    
    // 2. Clear the message from the session immediately (Flash message behavior)
    if (req.session.message) {
        delete req.session.message;
    }

    res.render("home", {
        title: "Ella Rises – Empowering Young Women",
        username: req.session.username || null,
        message: message // 3. Pass the message to the home.ejs view
    });
});

module.exports = router;