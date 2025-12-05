// routes/milestones.js

const express = require("express");
const router = express.Router();

const { requireAdmin, requireLogin } = require("../middleware/auth");
const Milestones = require("../models/milestones");
const Participants = require("../models/participants");

/* ============================================================
   LEVEL 1: MAIN INDEX ROUTE
   - If Manager: Shows List of Milestone Titles (With Search)
   - If User: Shows their OWN milestones
============================================================ */
router.get("/", requireLogin, async (req, res) => {
    try {
        // NORMALIZE THE CHECK: 
        const role = (req.session.access_level || "").toLowerCase();

        // SCENARIO 1: MANAGER LOGGED IN
        if (role === "manager" || role === "admin") {
            // 1. Capture Search Term
            const searchTerm = req.query.search || "";
            
            // 2. Fetch unique milestone titles (Pass search term to model)
            const milestoneTypes = await Milestones.getUniqueTitles(searchTerm);
            
            // Render the new Directory View for Milestone Types
            return res.render("milestones/types_index", { 
                title: "Milestone Achievements Directory",
                milestoneTypes: milestoneTypes,
                searchTerm: searchTerm, // 3. Pass back to view
                session: req.session
            });
        }

        // SCENARIO 2: PARTICIPANT LOGGED IN
        // Robust ID Check
        const myId = (req.session.user && req.session.user.participant_id) || 
                     req.session.participant_id || 
                     req.session.userID;

        if (!myId) {
            return res.redirect('/auth/login');
        }

        const myMilestones = await Milestones.getByParticipant(myId);
        
        res.render("milestones/index", {
            title: "My Milestones",
            milestones: myMilestones,
            participantName: "My",
            session: req.session
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Database Error");
    }
});

/* ============================================================
   LEVEL 2: DRILL-DOWN (View people who earned a specific Milestone Type)
   URL: /milestones/type/Python%20Coding%20Certificate
============================================================ */
router.get("/type/:title", requireAdmin, async (req, res) => {
    try {
        const milestoneTitle = req.params.title;
        const searchTerm = req.query.search || ""; // 1. Capture search term
        
        // Fetch all participants who have achieved this milestone
        let participants = await Milestones.getParticipantsByTitle(milestoneTitle);

        // 2. Filter the results if a search term exists
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            participants = participants.filter(p => 
                (p.first_name && p.first_name.toLowerCase().includes(lowerSearch)) ||
                (p.last_name && p.last_name.toLowerCase().includes(lowerSearch)) ||
                (p.email && p.email.toLowerCase().includes(lowerSearch))
            );
        }

        res.render("milestones/participants_by_type", { 
            title: `Participants with: ${milestoneTitle}`,
            participants: participants,
            milestoneTitle: milestoneTitle,
            searchTerm: searchTerm, // 3. Pass search term back to keep it in the box
            session: req.session
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading participants by milestone type");
    }
});

/* ============================================================
   EDIT MILESTONE TYPE (ADMIN ONLY) - NEW ROUTE
   URL: /milestones/type/:title/edit
============================================================ */

// Show edit form for a Milestone Type (Title)
router.get("/type/:title/edit", requireAdmin, async (req, res) => {
    try {
        const oldTitle = req.params.title;

        res.render("milestones/type_edit", {
            title: `Rename Milestone Type`,
            oldTitle: oldTitle,
            session: req.session
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading edit form");
    }
});

// Submit edit for a Milestone Type (Updates all records)
router.post("/type/:title/edit", requireAdmin, async (req, res) => {
    try {
        const oldTitle = req.params.title;
        const newTitle = req.body.MilestoneTitle;

        // NEW MODEL FUNCTION NEEDED: updateByTitle
        await Milestones.updateByTitle(oldTitle, newTitle);

        // Redirect to the new list view using the new title
        res.redirect(`/milestones/type/${encodeURIComponent(newTitle)}`);

    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating milestone type");
    }
});

/* ============================================================
   DELETE MILESTONE TYPE (ADMIN ONLY) - NEW ROUTE
   URL: /milestones/type/:title/delete
============================================================ */
router.post("/type/:title/delete", requireAdmin, async (req, res) => {
    try {
        const titleToDelete = req.params.title;

        // NEW MODEL FUNCTION NEEDED: deleteByTitle
        await Milestones.deleteByTitle(titleToDelete);

        // Redirect back to the main list of milestone types (Level 1)
        res.redirect(`/milestones`);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting milestone type");
    }
});


/* ============================================================
   LEVEL 3: MANAGER/PARTICIPANT DRILL-DOWN (View specific person's list)
   URL: /milestones/participant/5
============================================================ */
router.get("/participant/:id", requireLogin, async (req, res) => { // CHANGED to requireLogin
    try {
        const participantId = req.params.id;
        const loggedInUserId = req.session.userID;
        const role = (req.session.access_level || "").toLowerCase();
        
        // AUTHORIZATION CHECK: Admin OR Owner
        const isManager = role === 'manager' || role === 'admin';
        const isOwner = String(loggedInUserId) === String(participantId);

        if (!isManager && !isOwner) {
            return res.status(403).send("Unauthorized Access: You can only view your own milestones.");
        }
        
        // Fetch milestones for this specific person
        const milestones = await Milestones.getByParticipant(participantId);
        
        // Fetch participant details just for the name in the header
        const participant = await Participants.getById(participantId);

        if (!participant) return res.status(404).send("Participant not found");

        // We REUSE 'index.ejs' but populate it with this person's data
        res.render("milestones/index", {
            title: `${participant.first_name}'s Milestones`,
            milestones: milestones,
            participantName: `${participant.first_name}'s`,
            participant: participant,
            session: req.session
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading participant milestones");
    }
});


/* ============================================================
   NEW MILESTONE (ADMIN ONLY) - Existing logic
============================================================ */

// Show form
router.get("/new", requireAdmin, async (req, res) => {
    try {
        const participants = await Participants.getAll();
        
        const selectedId = req.query.participant_id;

        res.render("milestones/new", {
            title: "Add Milestone",
            participants,
            selectedId,
            session: req.session
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading form");
    }
});

// Submit form
router.post("/new", requireAdmin, async (req, res) => {
    try {
        const newMilestone = {
            participant_id: Number(req.body.ParticipantID),
            title: req.body.MilestoneTitle,
            achieved_date: req.body.MilestoneDate
        };

        await Milestones.create(newMilestone);
        
        // Redirect back to that specific user's list
        res.redirect(`/milestones/participant/${newMilestone.participant_id}`);

    } catch (err) {
        console.error(err);
        res.status(500).send("Error creating milestone");
    }
});


/* ============================================================
   EDIT MILESTONE (ADMIN ONLY) - Existing logic
   URL: /:pid/:mno/edit
============================================================ */

// Show edit form
router.get("/:pid/:mno/edit", requireAdmin, async (req, res) => {
    try {
        const milestone = await Milestones.getById(req.params.pid, req.params.mno);
        const participants = await Participants.getAll();

        if (!milestone) return res.status(404).send("Milestone not found");

        res.render("milestones/edit", {
            title: "Edit Milestone",
            milestone,
            participants,
            session: req.session
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading edit form");
    }
});

// Submit edit
router.post("/:pid/:mno/edit", requireAdmin, async (req, res) => {
    try {
        const updates = {
            title: req.body.MilestoneTitle,
            achieved_date: req.body.MilestoneDate
        };

        await Milestones.update(req.params.pid, req.params.mno, updates);
        
        // Redirect back to that specific user's list
        res.redirect(`/milestones/participant/${req.params.pid}`);

    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating milestone");
    }
});


/* ============================================================
   DELETE MILESTONE (ADMIN ONLY) - Existing logic
   URL: /:pid/:mno/delete
============================================================ */
router.post("/:pid/:mno/delete", requireAdmin, async (req, res) => {
    try {
        await Milestones.delete(req.params.pid, req.params.mno);
        
        // Redirect back to that specific user's list
        res.redirect(`/milestones/participant/${req.params.pid}`);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting milestone");
    }
});


/* ============================================================
   SHOW SINGLE MILESTONE (LOGIN REQUIRED) - Existing logic
   URL: /:pid/:mno
============================================================ */
router.get("/:pid/:mno", requireLogin, async (req, res) => {
    try {
        const milestone = await Milestones.getById(req.params.pid, req.params.mno);

        if (!milestone) return res.status(404).send("Milestone not found");

        // --- SECURITY FIX ---
        // Get role safely and convert to lowercase
        const role = (req.session.access_level || "").toLowerCase();

        // Allow if role is manager/admin OR if the user owns the milestone
        const isAuthorized = (role === 'manager' || role === 'admin') || 
                             (String(req.session.userID) === String(milestone.participant_id));

        if (!isAuthorized) {
             return res.status(403).send("Unauthorized Access");
        }
        // --------------------

        res.render("milestones/show", {
            title: "Milestone Details",
            milestone,
            session: req.session
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading details");
    }
});

module.exports = router;