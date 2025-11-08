"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireUser = exports.requireAdmin = exports.requireRole = void 0;
const requireRole = (roles) => {
    return (req, res, next) => {
        try {
            if (!req.authenticatedUser) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            const allowedRoles = Array.isArray(roles) ? roles : [roles];
            if (!allowedRoles.includes(req.authenticatedUser.role)) {
                res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions. This action requires higher privileges.'
                });
                return;
            }
            next();
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Internal server error during role verification'
            });
        }
    };
};
exports.requireRole = requireRole;
exports.requireAdmin = (0, exports.requireRole)('admin');
exports.requireUser = (0, exports.requireRole)(['user', 'admin']);
//# sourceMappingURL=role.middleware.js.map