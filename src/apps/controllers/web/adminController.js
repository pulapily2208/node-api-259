// File MỚI: src/apps/controllers/web/admin.js
const ProductModel = require("../../models/product");
const CustomerModel = require("../../models/customer");
const CommentModel = require("../../models/comment");
    
exports.index = async (req, res) => {
    try {
        const totalProducts = await ProductModel.countDocuments();
        const totalUsers = await CustomerModel.countDocuments();
        const totalComments = await CommentModel.countDocuments();
    
        // Render view admin.ejs và truyền dữ liệu
        return res.render("admin/admin", {
            products: totalProducts,
            users: totalUsers,
            comments: totalComments, 
        });
    } catch (error) {
        console.error("Lỗi khi render trang Admin:", error);
        // Trả về lỗi 500
        return res.status(500).send("Lỗi Server Nội bộ: " + error.message);
    }
};