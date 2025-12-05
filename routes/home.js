const express = require("express");
const router = express.Router();

/* GET / — home page */
router.get("/", (req, res) => {
    const message = req.session.message || null;
    if (req.session.message) delete req.session.message;

    res.render("home", {
        title: "Ella Rises – Empowering Young Women",
        username: req.session.username || null,
        message
    });
});

module.exports = router;
