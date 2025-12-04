const express = require("express");
const router = express.Router();
const { requireAdmin } = require("../middleware/auth"); 

// MODEL IMPORT
const Staff = require("../models/staff");

/* ============================================================
   READ: LIST ALL ADMIN USERS (staff/index.ejs)
============================================================ */
router.get("/", requireAdmin, async (req, res) => {
    try {
        const searchTerm = req.query.search || "";
        const managers = await Staff.getAll(searchTerm);

        res.render("staff/index", { 
            title: "Admin Accounts",
            managers, 
            searchTerm,
            session: req.session
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading user accounts");
    }
});

/* ============================================================
   CREATE: NEW USER FORM (staff/new.ejs)
============================================================ */
router.get("/new", requireAdmin, (req, res) => {
    res.render("staff/new", { 
        title: "Create New Admin Account",
        session: req.session 
    });
});

router.post("/new", requireAdmin, async (req, res) => {
    try {
        const newUser = {
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            email: req.body.email,
            password: req.body.password,
            // FIX: Role is hardcoded to 'admin'
            role: 'admin', 
        };

        await Staff.create(newUser);
        res.redirect("/staff");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error creating admin account.");
    }
});

/* ============================================================
   UPDATE: EDIT USER FORM (staff/edit.ejs) - GET
============================================================ */
router.get("/:id/edit", requireAdmin, async (req, res) => {
    try {
        const manager = await Staff.getById(req.params.id); 
        
        if (!manager) {
            console.error(`User with ID ${req.params.id} not found.`);
            return res.status(404).send("User not found.");
        }

        res.render("staff/edit", { 
            title: `Edit ${manager.first_name} Account`,
            manager,
            session: req.session 
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading edit form.");
    }
});

/* ============================================================
   UPDATE: EDIT USER FORM (staff/edit.ejs) - POST
============================================================ */
router.post("/:id/edit", requireAdmin, async (req, res) => {
    try {
        const updates = {
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            email: req.body.email,
            role: 'admin', 
        };

        if (req.body.password && req.body.password.length > 0) {
             updates.password = req.body.password;
        }

        await Staff.update(req.params.id, updates); 
        res.redirect("/staff");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating admin account.");
    }
});


/* ============================================================
   DELETE: DELETE USER
============================================================ */
router.post("/:id/delete", requireAdmin, async (req, res) => {
    try {
        await Staff.delete(req.params.id); 
        res.redirect("/staff");
    } catch (err) {
        console.error(err);
        if (err.code === "23503") return res.status(400).send("Cannot delete user: account is tied to existing records.");
        res.status(500).send("Error deleting manager account.");
    }
});

module.exports = router;