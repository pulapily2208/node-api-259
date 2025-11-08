const UserModel = require("../../models/user");
const paginate = require("../../../libs/paginate");
const bcrypt = require("bcrypt");
const { deleteUserToken } = require("../../../libs/token.service");

// POST /users - Tạo User mới
exports.create = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        const emailExists = await UserModel.findOne({ email });
        if (emailExists)
            return res.status(400).json({ status: "error", message: "Email already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = await UserModel.create({
            email,
            password: hashedPassword,
            role: role || "member",
        });

        const { password: _, ...others } = newUser.toObject();

        return res.status(201).json({
            status: "success",
            message: "User created successfully",
            data: others,
        });
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "Internal server error",
            error: error.message,
        });
    }
};

// GET /users - Lấy tất cả Users
exports.findAll = async (req, res) => {
    try {
        const query = {};
        if (req.query.role) query.role = req.query.role;
        if (req.query.keyword) query.email = { $regex: req.query.keyword, $options: "i" };

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = page * limit - limit;

        const users = await UserModel.find(query)
            .skip(skip)
            .limit(limit)
            .select("-password")
            .sort({ _id: -1 });

        return res.status(200).json({
            status: "success",
            message: "Get users successfully",
            data: users,
            pages: await paginate(page, limit, query, UserModel),
        });
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "Internal server error",
            error: error.message,
        });
    }
};

// GET /users/:id - Lấy chi tiết một User
exports.findOne = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await UserModel.findById(id).select("-password");
        
        if (!user) {
            return res.status(404).json({ status: "error", message: "User not found" });
        }
        
        return res.status(200).json({
            status: "success",
            message: "Get user successfully",
            data: user,
        });
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "Internal server error",
            error: error.message,
        });
    }
};

// PATCH /users/:id - Cập nhật User
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, password, role } = req.body;
        let updateData = { email, role };

        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        if (email) {
            const existingUser = await UserModel.findOne({ email, _id: { $ne: id } });
            if (existingUser) {
                return res.status(400).json({ status: "error", message: "Email already exists" });
            }
        }
    
        const updatedUser = await UserModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select("-password");
        if (!updatedUser) {
            return res.status(404).json({ status: "error", message: "User not found" });
        }
        return res.status(200).json({
            status: "success",
            message: "User updated successfully",
            data: updatedUser,
        });
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "Internal server error",
            error: error.message,
        });
    }
};

// DELETE /users/:id - Xóa User
exports.delete = async (req, res) => {
    try {
        const { id } = req.params;

        try {
            await deleteUserToken(id);
        } catch (tokenError) {
        }

        const deletedUser = await UserModel.findByIdAndDelete(id);

        if (!deletedUser) {
            return res.status(404).json({ status: "error", message: "User not found" });
        }

        return res.status(200).json({
            status: "success",
            message: "User deleted successfully",
            data: deletedUser,
        });
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "Internal server error",
            error: error.message,
        });
    }
};