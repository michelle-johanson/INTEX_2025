// middleware/auth.js

function requireLogin(req, res, next) {
    if (!req.session.isLoggedIn) {
        // Optional: Add a message if they are not logged in
        req.session.message = "Please log in to view that page.";
        req.session.returnTo = req.originalUrl;
        return res.redirect("/auth/login");
    }
    next();
}

function requireAdmin(req, res, next) {
    // 1. Check if the user is logged in AND has the correct role
    // We check for 'admin' (case-insensitive check for robustness)
    const userRole = (req.session.access_level || "").toLowerCase();
    
    if (userRole !== "admin") {
        
        // 2. Add the error message to the session
        req.session.message = "Access Denied: Only administrators can view the dashboard.";
        
        // 3. Redirect the user to the homepage
        return res.redirect("/"); 
    }
    
    // If authorized, proceed
    next();
}

module.exports = { requireLogin, requireAdmin };