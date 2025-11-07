const BannerModel = require("../../models/banner"); 
const paginateUtility = require("../../../libs/paginate");
const { body, validationResult } = require("express-validator");
const fs = require("fs");
const path = require("path");

const ADS_UPLOAD_DIR = path.join(__dirname, '..', '..', '..', 'public', 'upload', 'ads');

// --- 1. INDEX: Hiển thị danh sách Banner / Slider ---
exports.index = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = 10; 
        const skip = page * limit - limit;
        const type = req.query.type || "";
        let filter = {};
        
        const totalAds = await BannerModel.countDocuments(filter);
        const totalPages = Math.ceil(totalAds / limit);
        
        const ads = await BannerModel.find(filter)
            .sort({_id: -1 })
            .skip(skip)
            .limit(limit);
        
        const pagesData = await paginateUtility(page, limit, filter, BannerModel);
        const paginationArray = Array.from({ length: pagesData.total }, (_, i) => i + 1);

        const mappedAds = ads.map(ad => ({
            _id: ad._id,
            image: ad.image, 
            link: ad.url, 
            position: ad.position, 
            publish: ad.publish, 
        }));

        res.render("admin/banners/banner", {
            ads: mappedAds,
            title: "Quản Lý quảng cáo",
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
    res.render("admin/banners/add_banner", {
        title: "Thêm Banner/Slider",
        errors: req.flash('errors'),
        oldData: req.flash('oldData')[0] || {}, 
    });
};


// --- 3. STORE RULES: Validation cho form ---
exports.storeRules = [
    body("url").optional({ checkFalsy: true }).isURL().withMessage("URL không hợp lệ"),
    body("position").optional({ checkFalsy: true }).isInt({ min: 0 }).withMessage("Vị trí phải là số nguyên không âm"),
];


// --- 4. STORE (POST): Xử lý lưu Banner ---
exports.store = async (req, res) => {
    const errors = validationResult(req);
    const { body, file } = req;
    const { url, position, target, publish } = body; 

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
            image: file.filename, 
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
        req.flash('success', `Thêm banner thành công!`); 
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
            title: `Chỉnh Sửa Banner/Slider`,
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
    const { url, position, target, publish } = body; 
    
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
            url: url || '#', 
            position: Number(position) || 0,
            target: target === 'on', 
            publish: publish === 'on',
            image: oldAd.image,
        };

        if(file) {
            updateData.image = file.filename;
            
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
        req.flash('success', `Cập nhật banner thành công!`); 
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
        
        req.flash('success', `Xóa banner thành công!`); 
        res.redirect("/admin/banners"); 
    } catch (error) {
        console.error(`Lỗi khi xóa Banner ID ${req.params.id}:`, error);
        req.flash('errors', [{ msg: 'Lỗi server khi xóa quảng cáo.' }]);
        return res.redirect("/admin/banners"); 
    }
};

// --- 8. MOVE UP: Di chuyển quảng cáo lên (position - 1) ---
exports.moveUp = async (req, res) => {
    try {
        const { id } = req.params;
        const currentBanner = await BannerModel.findById(id);

        if (!currentBanner) {
            req.flash('errors', [{ msg: 'Banner không tồn tại.' }]);
            return res.redirect("/admin/banners");
        }

        const currentPosition = currentBanner.position;

        // 1. Tìm banner ngay trước đó (có position = currentPosition - 1)
        const previousBanner = await BannerModel.findOne({ position: currentPosition - 1 });

        // 2. Nếu tìm thấy banner trước, thực hiện hoán đổi
        if (previousBanner) {
            // Cập nhật 1: Banner hiện tại đi lên (vị trí - 1)
            await BannerModel.updateOne(
                { _id: currentBanner._id },
                { position: currentPosition - 1 }
            );

            // Cập nhật 2: Banner trước đó đi xuống (vị trí + 1, tức là vị trí cũ của banner hiện tại)
            await BannerModel.updateOne(
                { _id: previousBanner._id },
                { position: currentPosition }
            );

            req.flash('success', 'Đã di chuyển quảng cáo lên một vị trí.');
        } else {
            req.flash('errors', [{ msg: 'Quảng cáo đã ở vị trí cao nhất.' }]);
        }

        return res.redirect("/admin/banners");

    } catch (error) {
        console.error(`Lỗi khi di chuyển Banner ID ${req.params.id} lên:`, error);
        req.flash('errors', [{ msg: `Lỗi hệ thống khi di chuyển: ${error.message}` }]);
        return res.redirect("/admin/banners");
    }
};

// --- 9. MOVE DOWN: Di chuyển quảng cáo xuống (position + 1) ---
exports.moveDown = async (req, res) => {
    try {
        const { id } = req.params;
        const currentBanner = await BannerModel.findById(id);

        if (!currentBanner) {
            req.flash('errors', [{ msg: 'Banner không tồn tại.' }]);
            return res.redirect("/admin/banners");
        }

        const currentPosition = currentBanner.position;

        // 1. Tìm banner ngay sau đó (có position = currentPosition + 1)
        const nextBanner = await BannerModel.findOne({ position: currentPosition + 1 });

        // 2. Nếu tìm thấy banner sau, thực hiện hoán đổi
        if (nextBanner) {
            // Cập nhật 1: Banner hiện tại đi xuống (vị trí + 1)
            await BannerModel.updateOne(
                { _id: currentBanner._id },
                { position: currentPosition + 1 }
            );

            // Cập nhật 2: Banner sau đó đi lên (vị trí - 1, tức là vị trí cũ của banner hiện tại)
            await BannerModel.updateOne(
                { _id: nextBanner._id },
                { position: currentPosition }
            );

            req.flash('success', 'Đã di chuyển quảng cáo xuống một vị trí.');
        } else {
            req.flash('errors', [{ msg: 'Quảng cáo đã ở vị trí thấp nhất.' }]);
        }

        return res.redirect("/admin/banners");

    } catch (error) {
        console.error(`Lỗi khi di chuyển Banner ID ${req.params.id} xuống:`, error);
        req.flash('errors', [{ msg: `Lỗi hệ thống khi di chuyển: ${error.message}` }]);
        return res.redirect("/admin/banners");
    }
}