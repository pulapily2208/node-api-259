const { verify } = require("../../libs/jwt"); 
const config = require("config"); 

/**
 * Middleware: Xác thực Access Token cho User/Admin
 */
const verifyUserAccessToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({
                status: "error",
                message: "Access token not found"
            });
        }

        // verify() bây giờ là Promise
        const decoded = await verify(token, config.get("app.jwtAccessKey"));
        
        // Kiểm tra role: Chỉ cho phép admin hoặc member, từ chối customer
        if (decoded.role === "customer") {
            return res.status(403).json({
                status: "error",
                message: "Access denied. This endpoint is only for admin/member users."
            });
        }
        
        // Kiểm tra role phải là admin hoặc member
        if (!decoded.role || (decoded.role !== "admin" && decoded.role !== "member")) {
            return res.status(403).json({
                status: "error",
                message: "Access denied. Invalid user role."
            });
        }
        
        req.user = decoded; 
        next();
    } catch (error) {
        return res.status(401).json({
            status: "error",
            message: "Invalid or expired token",
            error: error.message
        });
    }
};

/**
 * Middleware: Xác thực Refresh Token cho User/Admin
 */
const verifyUserRefreshToken = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({
                status: "error",
                message: "Refresh token not found"
            });
        }

        // verify() bây giờ là Promise
        const decoded = await verify(refreshToken, config.get("app.jwtRefreshKey"));
        
        // Kiểm tra role: Chỉ cho phép admin hoặc member, từ chối customer
        if (decoded.role === "customer") {
            return res.status(403).json({
                status: "error",
                message: "Access denied. This endpoint is only for admin/member users."
            });
        }
        
        // Kiểm tra role phải là admin hoặc member
        if (!decoded.role || (decoded.role !== "admin" && decoded.role !== "member")) {
            return res.status(403).json({
                status: "error",
                message: "Access denied. Invalid user role."
            });
        }
        
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            status: "error",
            message: "Invalid or expired refresh token",
            error: error.message
        });
    }
};

// Export các hàm để web.js có thể sử dụng
module.exports = {
    verifyUserAccessToken,
    verifyUserRefreshToken
};