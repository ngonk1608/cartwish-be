const checkRole = (role) => (req, res, next) => {
    if (!req.user || req.user.role !== role) {
        return res.status(403).json({ message: `Access denied! ${role} ony!` })
    }
    next()
}

module.exports = checkRole