function requireLogin(req, res, next) {
    if (!req.session.isLoggedIn) {
        // 1. CAPTURE THE URL they tried to visit
        req.session.returnTo = req.originalUrl;
        
        req.session.message = "Please log in to view that page.";
        return res.redirect("/auth/login");
    }
    next();
}

function requireAdmin(req, res, next) {
    const userRole = (req.session.access_level || "").toLowerCase();
    
    if (userRole !== "admin" && userRole !== "manager") {
        req.session.message = "Access Denied: You do not have permission to view that page.";
        return res.redirect("/"); 
    }
    
    next();
}

module.exports = { requireLogin, requireAdmin };