const { verify } = require("../../libs/jwt"); 
const config = require("config"); 

/**
 * Middleware: Xác thực Access Token cho User/Admin
 */
const verifyUserAccessToken = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({
                status: "error",
                message: "Access token not found"
            });
        }

        verify(token, config.get("app.jwtAccessKey"), (err, decoded) => {
            if (err) {
                return res.status(401).json({
                    status: "error",
                    message: "Invalid or expired token"
                });
            }
            req.user = decoded; 
            next();
        });
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "Internal server error",
            error: error.message
        });
    }
};

/**
 * Middleware: Xác thực Refresh Token cho User/Admin
 */
const verifyUserRefreshToken = (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({
                status: "error",
                message: "Refresh token not found"
            });
        }

        verify(refreshToken, config.get("app.jwtRefreshKey"), (err, decoded) => {
            if (err) {
                return res.status(401).json({
                    status: "error",
                    message: "Invalid or expired refresh token"
                });
            }
            req.user = decoded;
            next();
        });
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "Internal server error",
            error: error.message
        });
    }
};

// Export các hàm để web.js có thể sử dụng
module.exports = {
    verifyUserAccessToken,
    verifyUserRefreshToken
};