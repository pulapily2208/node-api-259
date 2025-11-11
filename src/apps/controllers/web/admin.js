const ProductModel = require("../../models/product");
const CustomerModel = require("../../models/customer"); 
const CommentModel = require("../../models/comment");   
const BannerModel = require("../../models/banner");     


exports.index = async (req, res) => {
    try {
        const [
            totalProducts,
            totalUsers,      
            totalComments,
            totalBanners
        ] = await Promise.all([
            ProductModel.countDocuments({}),
            CustomerModel.countDocuments({}),
            CommentModel.countDocuments({}),
            BannerModel.countDocuments({})
        ]);

        // 2. Render view dashboard (admin/admin.ejs)
        return res.render("admin/admin", { 
            title: "Trang chủ quản trị",
            
            // ÁNH XẠ VÀO TÊN BIẾN EJS
            products: totalProducts,
            users: totalUsers, 
            comments: totalComments,
            banners: totalBanners,
            
            success: req.flash('success'), 
            errors: req.flash('errors'),
        });
        
    } catch (error) {
        console.error("Lỗi khi tải trang Dashboard (Model Count):", error.message);
        return res.status(500).send("Lỗi Server Nội bộ: Không thể truy vấn dữ liệu thống kê.");
    }
};