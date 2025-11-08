const UserModel = require("../../models/user");
const { generateAccessToken, generateRefreshToken, sign, verify } = require("../../../libs/jwt");
const { storeUserToken, deleteUserToken } = require("../../../libs/token.service");
const bcrypt = require("bcrypt");
const config = require("config");
const { addTokenBlackList } = require("../../../libs/redis.token");


// POST /auth/users/login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await UserModel.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ status: "error", message: "Invalid credentials (Email or Password is wrong)" });
        }
        const accessToken = await generateAccessToken(user);
        const refreshToken = await generateRefreshToken(user);
        await storeUserToken(user._id, accessToken, refreshToken);
        const { password: _, ...userData } = user.toObject();
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: "Strict",
            maxAge: 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            status: "success",
            message: "User login successful",
            data: userData,
            accessToken,
        });
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "Internal server error",
            error: error.message,
        });
    }
};

// POST /auth/users/logout
exports.logout = async (req, res) => {
    try {
        const userId = req.user.id; 
        await addTokenBlackList(userId);
        res.clearCookie('refreshToken');

        return res.status(200).json({
            status: "success",
            message: "User logged out successfully and tokens revoked",
        });
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "Internal server error",
            error: error.message,
        });
    }
};

// POST /auth/users/refresh
exports.refreshToken = async (req, res) => {
    try {
        const { user } = req; 
        const userModel = await UserModel.findById(user.id);

        if (!userModel) {
            return res.status(404).json({ status: "error", message: "User not found" });
        }
        const newAccessToken = await generateAccessToken(userModel);

        return res.status(200).json({
            status: "success",
            message: "Access Token refreshed successfully",
            accessToken: newAccessToken,
        });
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "Internal server error",
            error: error.message,
        });
    }
};

// GET /auth/users/me
exports.getMe = async (req, res) => {
    try {
        const { user } = req; 
        const userModel = await UserModel.findById(user.id).select('-password');
        
        if (!userModel) {
            return res.status(404).json({
                status: "error",
                message: "User not found",
            });
        }
        
        return res.status(200).json({
            status: "success",
            message: "User information retrieved successfully",
            data: userModel,
        });
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "Internal server error",
            error: error.message,
        });
    }
};