const checkAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied! Admin ony!" })
    }
    next()
}

module.exports = checkAdmin