const express = require("express");
const router = express.Router();

const { requireAdmin } = require("../middleware/auth");
const Staff = require("../models/staff");

/* GET /staff — list all admin users */
router.get("/", requireAdmin, async (req, res) => {
    try {
        const query = req.query.q || "";
        const staffList = await Staff.getAll(query);

        res.render("staff/index", {
            title: "Admin Accounts",
            staffList,
            query,
            session: req.session
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading admin accounts");
    }
});

/* GET /staff/new — create form */
router.get("/new", requireAdmin, (req, res) => {
    res.render("staff/new", {
        title: "Create New Admin Account",
        session: req.session
    });
});

/* POST /staff/new — create admin */
router.post("/new", requireAdmin, async (req, res) => {
    try {
        const newUser = {
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            email: req.body.email,
            password: req.body.password,
            role: "admin" // always admin
        };

        await Staff.create(newUser);
        res.redirect("/staff");

    } catch (err) {
        console.error(err);
        res.status(500).send("Error creating admin account");
    }
});

/* GET /staff/:id/edit — edit form */
router.get("/:id/edit", requireAdmin, async (req, res) => {
    try {
        const staffMember = await Staff.getById(req.params.id);
        if (!staffMember) return res.status(404).send("User not found");

        res.render("staff/edit", {
            title: `Edit ${staffMember.first_name}'s Account`,
            staffMember,
            session: req.session
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading edit form");
    }
});

/* POST /staff/:id/edit — update admin */
router.post("/:id/edit", requireAdmin, async (req, res) => {
    try {
        const updates = {
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            email: req.body.email,
            role: "admin"
        };

        if (req.body.password && req.body.password.trim().length > 0) {
            updates.password = req.body.password;
        }

        await Staff.update(req.params.id, updates);
        res.redirect("/staff");

    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating admin account");
    }
});

/* POST /staff/:id/delete — delete admin */
router.post("/:id/delete", requireAdmin, async (req, res) => {
    try {
        await Staff.delete(req.params.id);
        res.redirect("/staff");
    } catch (err) {
        console.error(err);
        if (err.code === "23503") {
            return res.status(400).send(
                "Cannot delete admin: account is tied to existing records."
            );
        }
        res.status(500).send("Error deleting admin account");
    }
});

module.exports = router;
