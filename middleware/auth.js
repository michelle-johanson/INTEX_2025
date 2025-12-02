// middleware/auth.js

function requireLogin(req, res, next) {
    if (!req.session.isLoggedIn) {
        return res.redirect("/auth/login");
    }
    next();
}

function requireAdmin(req, res, next) {
    if (req.session.access_level !== "admin") {
        return res.status(403).send("Access Denied — Admins Only");
    }
    next();
}

module.exports = { requireLogin, requireAdmin };
