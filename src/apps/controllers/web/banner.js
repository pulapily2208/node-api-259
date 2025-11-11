const axios = require('axios');
const config = require('config');
const { validationResult } = require('express-validator');

const apiPrefix = config.get('app.prefixApiVersion');
const DEFAULT_LIMIT = 10; 
const AD_SUBFOLDER = 'ads'; // Dựa trên đường dẫn upload của bạn: src/public/upload/ads/

const { buildCompactPagination } = require('../../../libs/view.pagination');

// Chuẩn hoá đường dẫn ảnh về dạng /upload/ads/filename
const normalizeAdImage = (value) => {
    if (!value || typeof value !== 'string') return '';
    let v = value.trim();
    v = v.replace(/^\/public\/upload\//i, '/upload/');
    if (!v.startsWith('/upload/')) v = `/upload/${AD_SUBFOLDER}/${v.replace(/^\/+/, '')}`;
    return v;
};

// --- 1. INDEX (GET /admin/banners) ---
exports.index = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || DEFAULT_LIMIT;
        // Đọc filter type từ URL. Mặc định là '' (Tất cả)
        const adTypeFilter = req.query.type || ''; 
        
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        
        // ĐÚNG ROUTE THEO web.js: /api/v3/admin/banners hoặc /api/v3/admin/sliders
        const adType = adTypeFilter === 'slider' ? 'slider' : 'banner';
        const apiUrl = `${baseUrl}${apiPrefix}/admin/${adType === 'slider' ? 'sliders' : 'banners'}`;
    const apiResponse = await axios.get(apiUrl, { params: { page, limit }, headers: req.authHeaders });
        const { docs: adsRaw, pages, total, limit: apiReturnLimit } = apiResponse.data.data;
        const adsWithProps = (Array.isArray(adsRaw) ? adsRaw : []).map(ad => ({
            ...ad,
            link: ad.url || '',
            type: adType,
            image: normalizeAdImage(ad.image)
        }));
        const totalPages = Number(pages?.totalPage || pages?.total || Math.ceil((total || 0) / (apiReturnLimit || limit))) || 0;
        const paginationArray = buildCompactPagination(totalPages, pages?.page || page);

        return res.render("admin/banners/banner", { 
            ads: adsWithProps,
            title: "Quản Lý Quảng Cáo",
            type: adTypeFilter, 
            success: req.flash('success'), 
            errors: req.flash('errors'),
            page: pages?.page || page,
            prev: pages?.hasPrev ? pages.prev : 1,
            next: pages?.hasNext ? pages.next : totalPages,
            totalPages: totalPages,
            paginate: paginationArray,
        });

    } catch (error) {
        console.error("Lỗi khi tải trang quản lý Banner/Slider:", error.message);
        const errorMessage = error.response?.data?.message || "Lỗi Server Nội bộ khi gọi API Banner/Slider.";
        return res.status(error.response?.status || 500).send(errorMessage);
    }
};
// --- 2. CREATE (GET /admin/banners/create) ---
exports.create = (req, res) => { 
    return res.render("admin/banners/add_banner", { 
        title: "Thêm Banner/Slider Mới",
        errors: req.flash('errors'),
        oldData: req.flash('oldData')
    }); 
};

// --- 3. STORE (POST /admin/banners/store) ---
exports.store = async (req, res) => { 
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) { /* ... (xử lý lỗi) */ }

    if (!req.file) {
        req.flash('errors', [{ msg: "Image is required" }]);
        return res.redirect("/admin/banners/create");
    }

    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const { type: adType } = req.body;
        
        // Quyết định endpoint dựa trên type từ form
    const apiUrl = `${baseUrl}${apiPrefix}/admin/${adType === 'slider' ? 'sliders' : 'banners'}`; 
    const imagePath = normalizeAdImage(req.file.filename);
    const adData = { ...req.body, image: imagePath };
    await axios.post(apiUrl, adData, { headers: req.authHeaders });
        
        req.flash('success', 'Thêm quảng cáo thành công!'); 
        return res.redirect("/admin/banners");

    } catch (error) {
        console.error("Lỗi khi thêm Banner:", error.message);
        const apiError = error.response?.data?.message || 'Lỗi server khi lưu banner.';
        req.flash('errors', [{ msg: apiError }]); 
        return res.redirect("/admin/banners/create");
    }
};

// --- 4. EDIT (GET /admin/banners/edit/:id) ---
exports.edit = async (req, res) => { 
    try {
        const { id } = req.params;
        const baseUrl = `${req.protocol}://${req.get('host')}`;
    
        const apiUrl = `${baseUrl}${apiPrefix}/admin/banners/${id}`; 
    const apiResponse = await axios.get(apiUrl, { headers: req.authHeaders });
        const banner = apiResponse.data.data;

        if (!banner) {
            req.flash('errors', [{ msg: 'Banner không tồn tại.' }]);
            return res.redirect("/admin/banners");
        }

    return res.render("admin/banners/edit_banner", { 
            title: "Chỉnh Sửa Banner",
            banner: banner, 
            errors: req.flash('errors') 
        }); 
    } catch (error) {
        console.error(`Lỗi khi tải trang chỉnh sửa Banner ID ${req.params.id}:`, error.message);
        req.flash('errors', [{ msg: 'Lỗi server khi truy cập chỉnh sửa banner.' }]);
        return res.redirect("/admin/banners");
    }
};

// --- 5. UPDATE (POST /admin/banners/update/:id) ---
exports.update = async (req, res) => { 
    const { id } = req.params;

    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
        req.flash('errors', validationErrors.array());
        return res.redirect(`/admin/banners/edit/${id}`); 
    }

    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        // Gọi API PATCH /api/v1/banners/:id (tương ứng với exports.updateBanner)
        const apiUrl = `${baseUrl}${apiPrefix}/admin/banners/${id}`; 
        
        let updateData = { ...req.body };
        
        // Xử lý ảnh mới (nếu có req.file)
        if (req.file) {
            updateData.image = `/public/upload/${AD_SUBFOLDER}/${req.file.filename}`;
        }
        
        // API Controller của bạn sẽ xử lý chuyển đổi Boolean/Number
        
    await axios.patch(apiUrl, updateData, { headers: req.authHeaders });
        
        req.flash('success', `Cập nhật banner thành công!`); 
        return res.redirect("/admin/banners");

    } catch (error) {
        console.error(`Lỗi khi cập nhật Banner ID ${id}:`, error.message);
        const apiError = error.response?.data?.message || 'Lỗi server khi cập nhật banner.';

        req.flash('errors', [{ msg: apiError }]);
        return res.redirect(`/admin/banners/edit/${id}`);
    }
};

// --- 6. DESTROY (GET /admin/banners/delete/:id) ---
exports.destroy = async (req, res) => { 
    try {
        const { id } = req.params;
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const apiUrl = `${baseUrl}${apiPrefix}/admin/banners/${id}`; 
        
        // Gọi API DELETE /api/v1/banners/:id (tương ứng với exports.deleteBanner)
    await axios.delete(apiUrl, { headers: req.authHeaders }); 
        
        req.flash('success', "Xóa banner thành công!");
        res.redirect("/admin/banners");
    } catch (error) {
        console.error(`Lỗi khi xóa Banner ID ${req.params.id}:`, error.message);
        const apiError = error.response?.data?.message || "Lỗi xóa banner.";
        
        req.flash('errors', [{ msg: apiError }]);
        res.redirect("/admin/banners");
    }
};

// --- 7. MOVE UP (GET /admin/banners/moveup/:id) ---
exports.moveUp = async (req, res) => {
    const { id } = req.params;
    // Đọc loại quảng cáo từ query param để biết nên gọi Banner hay Slider API
    const { type: adType = 'banner' } = req.query; 
    
    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        // Giả định API cho MoveUp là: PATCH /api/v1/banners/:id/moveup
    const apiUrl = `${baseUrl}${apiPrefix}/admin/${adType === 'slider' ? 'sliders' : 'banners'}/${id}/moveup`; 
        
    await axios.patch(apiUrl, null, { headers: req.authHeaders });
        req.flash('success', `Di chuyển ${adType} lên thành công!`); 
        res.redirect(`/admin/banners?type=${adType}`);
    } catch (error) {
        console.error("Lỗi khi Move Up:", error.message);
        req.flash('errors', [{ msg: "Không thể di chuyển quảng cáo." }]); 
        res.redirect(`/admin/banners?type=${adType}`);
    }
};

// --- 8. MOVE DOWN (GET /admin/banners/movedown/:id) ---
exports.moveDown = async (req, res) => {
    const { id } = req.params;
    const { type: adType = 'banner' } = req.query; 
    
    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        // Giả định API cho MoveDown là: PATCH /api/v1/banners/:id/movedown
    const apiUrl = `${baseUrl}${apiPrefix}/admin/${adType === 'slider' ? 'sliders' : 'banners'}/${id}/movedown`; 
        
    await axios.patch(apiUrl, null, { headers: req.authHeaders });
        req.flash('success', `Di chuyển ${adType} xuống thành công!`); 
        res.redirect(`/admin/banners?type=${adType}`);
    } catch (error) {
        console.error("Lỗi khi Move Down:", error.message);
        req.flash('errors', [{ msg: "Không thể di chuyển quảng cáo." }]); 
        res.redirect(`/admin/banners?type=${adType}`);
    }
};