// File: routes/users.js

const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth'); 

/* ============================================================
   FIX: Redirects the base URL /users/ to the maintenance index
============================================================ */
router.get('/', requireAdmin, (req, res) => {
    // Redirects the base path /users to the correct hub view
    res.redirect('/users/maintenance_index'); 
});

/* ============================================================
   USERS MAINTENANCE HUB INDEX (The page you want to show)
   URL: /users/maintenance_index
============================================================ */
router.get('/maintenance_index', requireAdmin, (req, res) => {
    res.render('users/maintenance_index', { 
        title: 'User Maintenance Dashboard',
        session: req.session 
    });
});

module.exports = router;