const BannerModel = require("../../models/banner"); 
const paginateUtility = require("../../../libs/paginate");
const { body, validationResult } = require("express-validator");
const fs = require("fs");
const path = require("path");

// Thư mục đích tuyệt đối để di chuyển file: [Dự án Root]/public/upload/ads
const ADS_UPLOAD_DIR = path.join(__dirname, '..', '..', '..', 'public', 'upload', 'ads');

// --- 1. INDEX: Hiển thị danh sách Banner / Slider ---
exports.index = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = 10; 
        const skip = page * limit - limit;
        const type = req.query.type || "";

        let filter = {};
        if (type === "banner" || type === "slider") {
            // LƯU Ý: Cần trường 'type' trong Model để filter
            filter.type = type; 
        }
        
        const totalAds = await BannerModel.countDocuments(filter);
        const totalPages = Math.ceil(totalAds / limit);
        
        const ads = await BannerModel.find(filter)
            .sort({ position: 1, _id: -1 })
            .skip(skip)
            .limit(limit);
        
        const pagesData = await paginateUtility(page, limit, filter, BannerModel);
        const paginationArray = Array.from({ length: pagesData.total }, (_, i) => i + 1);

        const mappedAds = ads.map(ad => ({
            _id: ad._id,
            name: ad.name, // Cần trường 'name' trong Model
            thumbnail_ads: ad.image, 
            type: ad.type, // Cần trường 'type' trong Model
            link: ad.url, 
            status: ad.publish ? 'active' : 'inactive', 
        }));

        res.render("admin/banners/banner", { // <-- SỬA VIEW PATH
            ads: mappedAds,
            title: "Quản Lý Banner/Slider",
            paginate: paginationArray,
            prev: pagesData.hasPrev ? pagesData.prev : 1,
            next: pagesData.hasNext ? pagesData.next : totalPages,
            page: pagesData.page,
            totalPages: totalPages,
            type: type, 
            success: req.flash('success'), 
            errors: req.flash('errors'),
        });

    } catch (error) {
        console.error("Lỗi khi tải trang Banner:", error);
        req.flash('errors', [{ msg: `Lỗi hệ thống: ${error.message}` }]);
        return res.redirect("/admin");
    }
};


// --- 2. CREATE (GET): Hiển thị form Thêm Banner ---
exports.create = async (req, res) => {
    res.render("admin/banners/add_banner", { // <-- SỬA VIEW PATH
        title: "Thêm Banner/Slider",
        errors: req.flash('errors'),
        oldData: req.flash('oldData')[0] || {}, 
    });
};


// --- 3. STORE RULES: Validation cho form ---
exports.storeRules = [
    body("name").notEmpty().withMessage("Tên/Tiêu đề là bắt buộc"),
    body("type").isIn(['banner', 'slider']).withMessage("Loại quảng cáo không hợp lệ"),
    body("url").optional({ checkFalsy: true }).isURL().withMessage("URL không hợp lệ"),
    body("position").optional({ checkFalsy: true }).isInt({ min: 0 }).withMessage("Vị trí phải là số nguyên không âm"),
];


// --- 4. STORE (POST): Xử lý lưu Banner ---
exports.store = async (req, res) => {
    const errors = validationResult(req);
    const { body, file } = req;
    // LƯU Ý: Cần trường 'name' và 'type' trong Model
    const { name, type, url, position, target, publish } = body; 

    if (!file) {
        req.flash('errors', [{ msg: 'Hình ảnh quảng cáo là bắt buộc.' }]);
        req.flash('oldData', [body]);
        return res.redirect("/admin/banners/create"); 
    }
    
    if (!errors.isEmpty()) {
        req.flash('errors', errors.array());
        req.flash('oldData', [body]);
        return res.redirect("/admin/banners/create"); 
    }

    try {
        let ads = {
            name: name,
            type: type,
            image: `/ads/${file.filename}`, 
            url: url || '#', 
            position: Number(position) || 0,
            target: target === 'on', 
            publish: publish === 'on', 
        };
        
        if (!fs.existsSync(ADS_UPLOAD_DIR)) {
            fs.mkdirSync(ADS_UPLOAD_DIR, { recursive: true });
        }
        fs.renameSync(
            file.path,
            path.join(ADS_UPLOAD_DIR, file.filename)
        );
        
        await BannerModel.create(ads);
        req.flash('success', `Thêm ${type} "${name}" thành công!`);
        return res.redirect("/admin/banners"); 
        
    } catch (error) {
        console.error("Lỗi khi thêm Banner:", error);
        if (file && fs.existsSync(path.join(ADS_UPLOAD_DIR, file.filename))) {
            fs.unlinkSync(path.join(ADS_UPLOAD_DIR, file.filename));
        }
        req.flash('errors', [{ msg: `Lỗi server khi lưu banner: ${error.message}` }]);
        return res.redirect("/admin/banners/create"); 
    }
};


// --- 5. EDIT (GET): Hiển thị form Chỉnh sửa ---
exports.edit = async (req, res) => {
    try {
        const {id} = req.params;
        const ad = await BannerModel.findById(id);
        
        if (!ad) {
            req.flash('errors', [{ msg: 'Banner/Slider không tồn tại.' }]);
            return res.redirect("/admin/banners"); 
        }

        res.render("admin/banners/edit_banner", {
            title: `Chỉnh Sửa Banner/Slider: ${ad.name}`,
            ad: ad,
            errors: req.flash('errors')
        });
    } catch (error) {
        console.error(`Lỗi khi lấy Banner ID ${req.params.id}:`, error);
        req.flash('errors', [{ msg: 'Lỗi server khi truy cập chỉnh sửa banner.' }]);
        return res.redirect("/admin/banners"); 
    }
};


// --- 6. UPDATE (POST): Xử lý cập nhật ---
exports.update = async (req, res) => {
    const errors = validationResult(req);
    const { id } = req.params;
    const { body, file } = req;
    // LƯU Ý: Cần trường 'name' và 'type' trong Model
    const { name, type, url, position, target, publish } = body; 
    
    if (!errors.isEmpty()) {
        req.flash('errors', errors.array());
        return res.redirect(`/admin/banners/edit/${id}`); 
    }

    try {
        const oldAd = await BannerModel.findById(id);
        if (!oldAd) {
            req.flash('errors', [{ msg: 'Banner/Slider không tồn tại.' }]);
            return res.redirect("/admin/banners"); 
        }
        
        let updateData = {
            name: name,
            type: type,
            url: url || '#', 
            position: Number(position) || 0,
            target: target === 'on', 
            publish: publish === 'on',
            image: oldAd.image,
        };

        if(file) {
            updateData.image = `/ads/${file.filename}`;
            
            if (!fs.existsSync(ADS_UPLOAD_DIR)) {
                fs.mkdirSync(ADS_UPLOAD_DIR, { recursive: true });
            }
            fs.renameSync(
                file.path,
                path.join(ADS_UPLOAD_DIR, file.filename)
            );
            
            if (oldAd.image) {
                const oldFilePath = path.join(ADS_UPLOAD_DIR, path.basename(oldAd.image));
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            }
        }
        
        await BannerModel.updateOne({_id: id}, {$set: updateData});
        req.flash('success', `Cập nhật quảng cáo "${name}" thành công!`);
        return res.redirect("/admin/banners"); 
        
    } catch (error) {
        console.error(`Lỗi khi cập nhật Banner ID ${id}:`, error);
        req.flash('errors', [{ msg: `Lỗi server khi cập nhật quảng cáo: ${error.message}` }]);
        return res.redirect(`/admin/banners/edit/${id}`); 
    }
};


// --- 7. DESTROY (GET): Xử lý xóa ---
exports.destroy = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedAd = await BannerModel.findByIdAndDelete(id);

        if (!deletedAd) {
            req.flash('errors', [{ msg: 'Banner/Slider không tồn tại để xóa.' }]);
            return res.redirect("/admin/banners"); 
        }
        
        if (deletedAd.image) {
            const imageFileName = path.basename(deletedAd.image);
            const imagePath = path.join(ADS_UPLOAD_DIR, imageFileName);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        
        req.flash('success', `Xóa quảng cáo "${deletedAd.name}" thành công!`);
        res.redirect("/admin/banners"); 
    } catch (error) {
        console.error(`Lỗi khi xóa Banner ID ${req.params.id}:`, error);
        req.flash('errors', [{ msg: 'Lỗi server khi xóa quảng cáo.' }]);
        return res.redirect("/admin/banners"); 
    }
};