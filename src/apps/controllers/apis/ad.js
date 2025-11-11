const BannerModel = require("../../models/banner");
const SliderModel = require("../../models/slider");
const paginate = require("../../../libs/paginate");

/**
 * Lấy danh sách quảng cáo theo Model (Banner/Slider)
 */
const getAdListPublic = async (Model, req, res, adType) => {
    const { page, limit } = req.query;
    
    const currentPage = parseInt(page) || 1;
    const currentLimit = parseInt(limit) || 10;
    const criteria = { publish: true }; // Chỉ lấy đã publish

    try {
        // Lấy tổng số documents
        const total = await Model.countDocuments(criteria);
        
        // Lấy documents cho trang hiện tại
        const docs = await Model.find(criteria)
            .sort({ position: 1, updatedAt: -1 })
            .skip((currentPage - 1) * currentLimit)
            .limit(currentLimit);
        
        // Tính toán pagination
        const totalPages = Math.ceil(total / currentLimit);
        const hasNext = currentPage < totalPages;
        const hasPrev = currentPage > 1;
        
        res.status(200).json({
            message: `Get public ${adType} list success`,
            data: {
                docs: docs,
                pages: {
                    page: currentPage,
                    totalPage: totalPages,
                    hasNext: hasNext,
                    hasPrev: hasPrev,
                    next: hasNext ? currentPage + 1 : null,
                    prev: hasPrev ? currentPage - 1 : null,
                },
                total: total,
                page: currentPage,
                limit: currentLimit
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
    
    const currentPage = parseInt(page) || 1;
    const currentLimit = parseInt(limit) || 10;
    const criteria = {}; // Lấy TẤT CẢ (kể cả chưa publish)

    try {
        // Lấy tổng số documents
        const total = await Model.countDocuments(criteria);
        
        // Lấy documents cho trang hiện tại
        const docs = await Model.find(criteria)
            .sort({ position: 1, updatedAt: -1 })
            .skip((currentPage - 1) * currentLimit)
            .limit(currentLimit);
        
        // Tính toán pagination
        const totalPages = Math.ceil(total / currentLimit);
        const hasNext = currentPage < totalPages;
        const hasPrev = currentPage > 1;
        
        res.status(200).json({
            message: `Get admin ${adType} list success`,
            data: {
                docs: docs,
                pages: {
                    page: currentPage,
                    totalPage: totalPages,
                    hasNext: hasNext,
                    hasPrev: hasPrev,
                    next: hasNext ? currentPage + 1 : null,
                    prev: hasPrev ? currentPage - 1 : null,
                },
                total: total,
                page: currentPage,
                limit: currentLimit
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
    const { url, target, publish, image } = req.body; 

    // FIX 2: Kiểm tra file dựa trên giá trị đã được gán bởi upload.js
    if (!image) {
        return res.status(400).json({ message: "Image is required" });
    }

    try {
        // LOGIC MỚI: Tăng position của TẤT CẢ banner hiện có lên +1
        await Model.updateMany({}, { $inc: { position: 1 } });
        
        // FIX 3: Tạo banner mới với position = 0 (luôn ở đầu)
        const newAd = new Model({
            image, // Sử dụng đường dẫn image đã được gán
            url,
            target: target === 'true', // Chuyển String 'true' sang Boolean true
            position: 0, // Luôn là 0 - vị trí đầu tiên
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

        // Giảm position của tất cả banner có position > deletedAd.position
        await Model.updateMany(
            { position: { $gt: deletedAd.position } },
            { $inc: { position: -1 } }
        );

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

/**
 * Di chuyển quảng cáo lên (giảm position)
 */
const moveAdUp = async (Model, req, res, adType) => {
    const { id } = req.params;
    
    try {
        // Lấy banner hiện tại
        const currentAd = await Model.findById(id);
        if (!currentAd) {
            return res.status(404).json({ message: `${adType} not found` });
        }
        
        const currentPosition = currentAd.position;
        
        // Nếu đã ở vị trí đầu tiên (0), không thể move up
        if (currentPosition <= 0) {
            return res.status(400).json({ 
                message: `${adType} is already at the top position` 
            });
        }
        
        const newPosition = currentPosition - 1;
        
        // Tìm banner ở vị trí mục tiêu (vị trí sẽ swap)
        const targetAd = await Model.findOne({ position: newPosition });
        
        // Bắt đầu transaction để đảm bảo cả 2 update thành công
        // Swap positions
        currentAd.position = newPosition;
        await currentAd.save();
        
        if (targetAd) {
            targetAd.position = currentPosition;
            await targetAd.save();
        }
        
        res.status(200).json({
            message: `${adType} moved up successfully`,
            data: currentAd,
        });
    } catch (error) {
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

/**
 * Di chuyển quảng cáo xuống (tăng position)
 */
const moveAdDown = async (Model, req, res, adType) => {
    const { id } = req.params;
    
    try {
        // Lấy banner hiện tại
        const currentAd = await Model.findById(id);
        if (!currentAd) {
            return res.status(404).json({ message: `${adType} not found` });
        }
        
        const currentPosition = currentAd.position;
        
        // Lấy tổng số ads để kiểm tra vị trí cuối
        const totalAds = await Model.countDocuments();
        
        // Nếu đã ở vị trí cuối, không thể move down
        if (currentPosition >= totalAds - 1) {
            return res.status(400).json({ 
                message: `${adType} is already at the bottom position` 
            });
        }
        
        const newPosition = currentPosition + 1;
        
        // Tìm banner ở vị trí mục tiêu (vị trí sẽ swap)
        const targetAd = await Model.findOne({ position: newPosition });
        
        // Swap positions
        currentAd.position = newPosition;
        await currentAd.save();
        
        if (targetAd) {
            targetAd.position = currentPosition;
            await targetAd.save();
        }
        
        res.status(200).json({
            message: `${adType} moved down successfully`,
            data: currentAd,
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
exports.moveBannerUp = (req, res) => moveAdUp(BannerModel, req, res, 'Banner');
exports.moveBannerDown = (req, res) => moveAdDown(BannerModel, req, res, 'Banner');

// --- Admin APIs (Slider) ---
exports.adminListSliders = (req, res) => getAdListAdmin(SliderModel, req, res, 'slider');
exports.createSlider = (req, res) => createAd(SliderModel, req, res, 'Slider');
exports.getSliderDetail = (req, res) => getAdDetail(SliderModel, req, res, 'Slider');
exports.updateSlider = (req, res) => updateAd(SliderModel, req, res, 'Slider');
exports.deleteSlider = (req, res) => deleteAd(SliderModel, req, res, 'Slider');
exports.moveSliderUp = (req, res) => moveAdUp(SliderModel, req, res, 'Slider');
exports.moveSliderDown = (req, res) => moveAdDown(SliderModel, req, res, 'Slider');