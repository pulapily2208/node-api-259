const BannerModel = require("../../models/banner");
const SliderModel = require("../../models/slider");
const paginate = require("../../../libs/paginate");

/**
 * Lấy danh sách quảng cáo theo Model (Banner/Slider)
 */
const getAdListPublic = async (Model, req, res, adType) => {
    const { page, limit } = req.query;

    const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        sort: { position: 1, updatedAt: -1 },
        criteria: { publish: true } 
    };

    try {
        const ads = await paginate(Model, options);
        res.status(200).json({
            message: `Get public ${adType} list success`,
            data: {
                docs: ads.docs,
                pages: ads.pages,
                total: ads.total,
                page: ads.page,
                limit: ads.limit
            },
        });
    } catch (error) {
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

/**
 * Lấy danh sách quảng cáo theo Model (Banner/Slider)
 * Dùng cho Admin Panel (lấy tất cả)
 */
const getAdListAdmin = async (Model, req, res, adType) => {
    const { page, limit } = req.query;

    const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        sort: { position: 1, updatedAt: -1 }, 
        criteria: {} // Lấy TẤT CẢ (kể cả chưa publish)
    };

    try {
        const ads = await paginate(Model, options);
        res.status(200).json({
            message: `Get admin ${adType} list success`,
            data: {
                docs: ads.docs,
                pages: ads.pages,
                total: ads.total,
                page: ads.page,
                limit: ads.limit
            },
        });
    } catch (error) {
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

/**
 * Tạo mới quảng cáo
 */
const createAd = async (Model, req, res, adType) => {
    // FIX 1: Lấy trường 'image' trực tiếp từ req.body (đã được upload.js gán)
    // Lấy tất cả các trường cần thiết từ req.body
    const { url, target, position, publish, image } = req.body; 

    // console.log(`--- DEBUG: Data received by Controller for ${adType} ---`);
    // console.log("req.body:", req.body);
    // console.log("req.body.image:", image);
    // console.log("------------------------------------------------------");

    // FIX 2: Kiểm tra file dựa trên giá trị đã được gán bởi upload.js
    if (!image) {
        return res.status(400).json({ message: "Image is required" });
    }

    try {
        // FIX 3: Chuyển đổi các giá trị String từ form-data sang kiểu dữ liệu Schema mong muốn
        const newAd = new Model({
            image, // Sử dụng đường dẫn image đã được gán
            url,
            target: target === 'true', // Chuyển String 'true' sang Boolean true
            position: parseInt(position) || 0, // Chuyển String '4' sang Number 4
            publish: publish === 'true', // Chuyển String 'true' sang Boolean true
        });
        await newAd.save();

        res.status(201).json({
            message: `${adType} created successfully`,
            data: newAd,
        });
    } catch (error) {
        // Xử lý lỗi validation nếu Mongoose vẫn gặp vấn đề khác
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                message: `Validation Error: ${error.message}`,
                error: error.message
            });
        }
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

/**
 * Cập nhật quảng cáo
 */
const updateAd = async (Model, req, res, adType) => {
    const { id } = req.params;
    // Lấy các trường từ req.body, bao gồm cả 'image' (nếu có file upload mới, image sẽ là đường dẫn mới)
    const { url, target, position, publish, image } = req.body; 

    try {
        const updateData = {
            url,
            target: target === 'true', // Chuyển đổi Boolean
            position: parseInt(position) || 0, // Chuyển đổi Number
            publish: publish === 'true', // Chuyển đổi Boolean
        };
        
        // FIX: Xử lý cập nhật ảnh
        // Nếu req.body.image tồn tại (đã được gán bởi upload.js) thì đó là ảnh mới
        if (image) {
            updateData.image = image;
        }

        const updatedAd = await Model.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true } // Trả về tài liệu mới và chạy validator
        );

        if (!updatedAd) {
            return res.status(404).json({ message: `${adType} not found` });
        }

        res.status(200).json({
            message: `${adType} updated successfully`,
            data: updatedAd,
        });
    } catch (error) {
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

/**
 * Lấy chi tiết quảng cáo
 */
const getAdDetail = async (Model, req, res, adType) => {
    try {
        const ad = await Model.findById(req.params.id);

        if (!ad) {
            return res.status(404).json({ message: `${adType} not found` });
        }

        res.status(200).json({
            message: `Get ${adType} detail success`,
            data: ad,
        });
    } catch (error) {
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

/**
 * Xóa quảng cáo
 */
const deleteAd = async (Model, req, res, adType) => {
    try {
        const deletedAd = await Model.findByIdAndDelete(req.params.id);

        if (!deletedAd) {
            return res.status(404).json({ message: `${adType} not found` });
        }

        res.status(200).json({
            message: `${adType} deleted successfully`,
            data: deletedAd,
        });
    } catch (error) {
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};


// =================================================================
// EXPORT CÁC HÀM CỤ THỂ CHO ROUTER
// =================================================================

// --- Public APIs ---
exports.listBanners = (req, res) => getAdListPublic(BannerModel, req, res, 'banner');
exports.listSliders = (req, res) => getAdListPublic(SliderModel, req, res, 'slider');

// --- Admin APIs (Banner) ---
exports.adminListBanners = (req, res) => getAdListAdmin(BannerModel, req, res, 'banner');
exports.createBanner = (req, res) => createAd(BannerModel, req, res, 'Banner');
exports.getBannerDetail = (req, res) => getAdDetail(BannerModel, req, res, 'Banner');
exports.updateBanner = (req, res) => updateAd(BannerModel, req, res, 'Banner');
exports.deleteBanner = (req, res) => deleteAd(BannerModel, req, res, 'Banner');

// --- Admin APIs (Slider) ---
exports.adminListSliders = (req, res) => getAdListAdmin(SliderModel, req, res, 'slider');
exports.createSlider = (req, res) => createAd(SliderModel, req, res, 'Slider');
exports.getSliderDetail = (req, res) => getAdDetail(SliderModel, req, res, 'Slider');
exports.updateSlider = (req, res) => updateAd(SliderModel, req, res, 'Slider');
exports.deleteSlider = (req, res) => deleteAd(SliderModel, req, res, 'Slider');