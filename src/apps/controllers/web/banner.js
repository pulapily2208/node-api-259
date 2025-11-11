const axios = require('axios');
const config = require('config');
const { validationResult } = require('express-validator');

const apiPrefix = config.get('app.prefixApiVersion');
const DEFAULT_LIMIT = 10; 
const AD_SUBFOLDER = 'ads'; 

const { buildCompactPagination } = require('../../../libs/view.pagination');

// Chuẩn hoá đường dẫn ảnh về dạng /upload/banners/ hoặc /upload/sliders/
const normalizeAdImage = (value, subfolder = 'banners') => {
    try {
        if (!value || typeof value !== 'string') return '/static/admin/img/placeholder.png';
        let v = value.trim();
        
        // Nếu đã có /upload/ thì return luôn
        if (v.startsWith('/upload/')) return v;
        
        // Nếu bắt đầu bằng /public/upload/ thì bỏ /public
        if (v.startsWith('/public/upload/')) {
            return v.replace(/^\/public/, '');
        }
        
        // Nếu chỉ là tên file (không có path), thêm /upload/{subfolder}/
        if (!v.includes('/')) {
            return `/upload/${subfolder}/${v}`;
        }
        
        // Các trường hợp khác
        return `/upload/${subfolder}/${v.replace(/^\/+/, '')}`;
    } catch (error) {
        console.error('normalizeAdImage error:', error.message, 'for value:', value);
        return '/static/admin/img/placeholder.png';
    }
};

// Helper: Detect ad type từ request path
const detectAdType = (req) => {
    if (req.path.includes('/sliders')) return 'slider';
    if (req.query.type === 'slider') return 'slider';
    return 'banner';
};

// --- 1. INDEX (GET /admin/banners hoặc /admin/sliders) ---
exports.index = async (req, res) => {
    try {
        // Kiểm tra session trước
        if (!req.session || !req.session.accessToken) {
            console.error('Banner index - No session or token found');
            req.flash('errors', [{ msg: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.' }]);
            return res.redirect('/login');
        }

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || DEFAULT_LIMIT;
        const reqType = req.query.type || ''; // '', 'banner', 'slider'
        const baseUrl = `${req.protocol}://${req.get('host')}`;

        let combinedAds = [];
        let total = 0;
        let totalPages = 0;
        let apiReturnLimit = limit;
        let currentPage = page;

        if (!reqType || reqType === 'all') {
            // Lấy cả hai loại rồi gộp
            const bannerUrl = `${baseUrl}${apiPrefix}/admin/banners`;
            const sliderUrl = `${baseUrl}${apiPrefix}/admin/sliders`;
            console.log('All ads index - fetching both banners and sliders');
            
            try {
                const [bannerRes, sliderRes] = await Promise.all([
                    axios.get(bannerUrl, { params: { page: 1, limit: 1000 }, headers: req.authHeaders, timeout: 5000 }),
                    axios.get(sliderUrl, { params: { page: 1, limit: 1000 }, headers: req.authHeaders, timeout: 5000 })
                ]);
                const bannerAds = (bannerRes.data.data.docs || []).map(ad => ({ ...ad, type: 'banner' }));
                const sliderAds = (sliderRes.data.data.docs || []).map(ad => ({ ...ad, type: 'slider' }));
                
                console.log(`Fetched ${bannerAds.length} banners and ${sliderAds.length} sliders`);
                
                combinedAds = [...bannerAds, ...sliderAds]
                    .sort((a,b) => a.position - b.position || new Date(b.updatedAt) - new Date(a.updatedAt));
                total = combinedAds.length;
                totalPages = Math.ceil(total / limit) || 1;
                apiReturnLimit = limit;
                currentPage = page;
                // Cắt trang sau khi gộp
                const sliceStart = (page - 1) * limit;
                const sliceEnd = sliceStart + limit;
                combinedAds = combinedAds.slice(sliceStart, sliceEnd);
            } catch (fetchError) {
                console.error('Error fetching ads:', fetchError.message);
                combinedAds = [];
                total = 0;
                totalPages = 1;
            }
        } else {
            // Chỉ một loại
            const subfolder = reqType === 'slider' ? 'sliders' : 'banners';
            const apiUrl = `${baseUrl}${apiPrefix}/admin/${subfolder}`;
            console.log(`${reqType} index - calling API:`, apiUrl);
            const apiResponse = await axios.get(apiUrl, { params: { page, limit }, headers: req.authHeaders, timeout: 10000 });
            const { docs: adsRaw, pages, total: oneTotal, limit: oneLimit } = apiResponse.data.data;
            total = oneTotal;
            apiReturnLimit = oneLimit || limit;
            currentPage = pages?.page || page;
            totalPages = Number(pages?.totalPage || Math.ceil((total || 0) / (apiReturnLimit || limit))) || 0;
            combinedAds = (Array.isArray(adsRaw) ? adsRaw : []).map(ad => ({ ...ad, type: reqType }));
        }

        const adsWithProps = combinedAds.map(ad => {
            const subfolder = ad.type === 'slider' ? 'sliders' : 'banners';
            return {
                ...ad,
                link: ad.url || '#',
                image: normalizeAdImage(ad.image, subfolder),
                position: ad.position || 0,
                publish: ad.publish || false,
            };
        });

        let paginationArray = [];
        try {
            paginationArray = buildCompactPagination(totalPages, currentPage);
        } catch (err) {
            console.error('Banner index - pagination error:', err.message);
        }

        return res.render("admin/banners/banner", {
            ads: adsWithProps,
            title: reqType === 'slider' ? "Quản Lý Slider" : (reqType === 'banner' ? "Quản Lý Banner" : "Quản Lý Quảng Cáo"),
            type: reqType || '',
            success: req.flash('success'),
            errors: req.flash('errors'),
            page: currentPage,
            prev: currentPage > 1 ? currentPage - 1 : 1,
            next: currentPage < totalPages ? currentPage + 1 : totalPages,
            totalPages: totalPages,
            paginate: paginationArray,
        });

    } catch (error) {
        console.error("Lỗi khi tải trang quản lý Banner/Slider:", error.message);
        if (error.response) {
            console.error("API Response Status:", error.response.status);
            console.error("API Response Data:", error.response.data);
        } else if (error.request) {
            console.error("No response received from API");
        } else {
            console.error("Request setup error:", error.message);
        }
        
        const errorMessage = error.response?.data?.message || "Lỗi Server Nội bộ khi gọi API Banner/Slider.";
        
        if (error.response?.status === 401 || error.response?.status === 403) {
            req.flash('errors', [{ msg: 'Phiên đăng nhập hết hạn hoặc không có quyền truy cập. Vui lòng đăng nhập lại.' }]);
            return res.redirect('/login');
        }
        
        req.flash('errors', [{ msg: errorMessage }]);
        
        // Render empty banner page thay vì res.send
        const adType = detectAdType(req);
        return res.render("admin/banners/banner", {
            ads: [],
            title: adType === 'slider' ? "Quản Lý Slider" : "Quản Lý Banner",
            type: adType,
            success: req.flash('success'),
            errors: req.flash('errors'),
            page: 1,
            prev: 1,
            next: 1,
            totalPages: 0,
            paginate: []
        });
    }
};
// --- 2. CREATE (GET /admin/banners/create) ---
exports.create = (req, res) => { 
    const adType = detectAdType(req);
    return res.render("admin/banners/add_banner", { 
        title: adType === 'slider' ? "Thêm Slider Mới" : "Thêm Banner Mới",
        type: adType,
        errors: req.flash('errors'),
        oldData: req.flash('oldData')
    }); 
};

// --- 3. STORE (POST /admin/banners/store) ---
exports.store = async (req, res) => { 
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) { 
        req.flash('errors', validationErrors.array());
        return res.redirect("/admin/banners/create");
    }

    if (!req.file) {
        req.flash('errors', [{ msg: "Image is required" }]);
        return res.redirect("/admin/banners/create");
    }

    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const adType = detectAdType(req) || req.body.type || 'banner';
        const subfolder = adType === 'slider' ? 'sliders' : 'banners';

        // Multer đã upload file vào /upload/products, cần move sang đúng subfolder
        const fs = require('fs');
        const path = require('path');
        
        const oldPath = req.file.path; // Đường dẫn hiện tại (products)
        const filename = req.file.filename; // Multer đã đặt tên với timestamp
        const newDir = path.join(__dirname, '..', '..', '..', 'public', 'upload', subfolder);
        const newPath = path.join(newDir, filename);
        
        console.log(`[UPLOAD] Moving file from ${oldPath} to ${newPath}`);
        
        // Đảm bảo thư mục tồn tại
        if (!fs.existsSync(newDir)) {
            console.log(`[UPLOAD] Creating directory: ${newDir}`);
            fs.mkdirSync(newDir, { recursive: true });
        }
        
        // Di chuyển file
        try {
            fs.renameSync(oldPath, newPath);
            console.log(`[UPLOAD] File moved successfully`);
        } catch (moveError) {
            console.error(`[UPLOAD] Error moving file:`, moveError);
            // Thử copy và delete nếu rename fail (có thể do khác ổ đĩa)
            fs.copyFileSync(oldPath, newPath);
            fs.unlinkSync(oldPath);
            console.log(`[UPLOAD] File copied and original deleted`);
        }
        
        const imagePath = `/upload/${subfolder}/${filename}`;
        console.log(`[UPLOAD] Final image path: ${imagePath}`);

        // Endpoint theo loại
        const apiUrl = `${baseUrl}${apiPrefix}/admin/${subfolder}`; 
        const adData = { 
            url: req.body.url || '#',
            target: req.body.target || 'false',
            publish: req.body.publish || 'false',
            image: imagePath 
        };
        
        console.log('[API] Posting to:', apiUrl);
        console.log('[API] Data:', JSON.stringify(adData, null, 2));
        
        const response = await axios.post(apiUrl, adData, { 
            headers: {
                ...req.authHeaders,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('[API] Response:', response.data);
        
        req.flash('success', `Thêm ${adType} thành công!`); 
        return res.redirect(`/admin/banners?type=${adType}`);

    } catch (error) {
        console.error("Lỗi khi thêm Banner:", error.message);
        if (error.response) {
            console.error('API Error Response:', error.response.status, error.response.data);
        }
        const apiError = error.response?.data?.message || 'Lỗi server khi lưu banner.';
        req.flash('errors', [{ msg: apiError }]); 
        return res.redirect(`/admin/banners/create?type=${detectAdType(req)}`);
    }
};

// --- 4. EDIT (GET /admin/banners/edit/:id) ---
exports.edit = async (req, res) => { 
    try {
        const { id } = req.params;
        const adType = detectAdType(req);
        const subfolder = adType === 'slider' ? 'sliders' : 'banners';
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const apiUrl = `${baseUrl}${apiPrefix}/admin/${subfolder}/${id}`; 
        const apiResponse = await axios.get(apiUrl, { headers: req.authHeaders });
        const bannerRaw = apiResponse.data.data;

        if (!bannerRaw) {
            req.flash('errors', [{ msg: 'Banner không tồn tại.' }]);
            return res.redirect("/admin/banners");
        }
        
        // Normalize image và thêm các field cần thiết
        const ad = {
            ...bannerRaw,
            image: normalizeAdImage(bannerRaw.image, subfolder),
            type: adType
        };

        return res.render("admin/banners/edit_banner", { 
            title: adType === 'slider' ? "Chỉnh Sửa Slider" : "Chỉnh Sửa Banner",
            type: adType,
            ad: ad, 
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
        const adType = detectAdType(req);
        const subfolder = adType === 'slider' ? 'sliders' : 'banners';
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const apiUrl = `${baseUrl}${apiPrefix}/admin/${subfolder}/${id}`; 
        
        let updateData = { ...req.body };
        
        // Nếu có file upload mới, xử lý như create
        if (req.file) {
            const fs = require('fs');
            const path = require('path');
            
            const oldPath = req.file.path;
            const filename = req.file.filename; // Multer đã đặt tên
            const newDir = path.join(__dirname, '..', '..', '..', 'public', 'upload', subfolder);
            const newPath = path.join(newDir, filename);
            
            console.log(`[UPDATE] Moving file from ${oldPath} to ${newPath}`);
            
            if (!fs.existsSync(newDir)) {
                fs.mkdirSync(newDir, { recursive: true });
            }
            
            try {
                fs.renameSync(oldPath, newPath);
            } catch (moveError) {
                fs.copyFileSync(oldPath, newPath);
                fs.unlinkSync(oldPath);
            }
            
            updateData.image = `/upload/${subfolder}/${filename}`;
            console.log(`[UPDATE] New image uploaded: ${updateData.image}`);
        }
        
        await axios.patch(apiUrl, updateData, { 
            headers: {
                ...req.authHeaders,
                'Content-Type': 'application/json'
            }
        });
        
        req.flash('success', `Cập nhật ${adType} thành công!`); 
        return res.redirect(`/admin/banners?type=${adType}`);

    } catch (error) {
        console.error(`Lỗi khi cập nhật Banner ID ${id}:`, error.message);
        if (error.response) {
            console.error('API Error Response:', error.response.status, error.response.data);
        }
        const apiError = error.response?.data?.message || 'Lỗi server khi cập nhật banner.';

        req.flash('errors', [{ msg: apiError }]);
        return res.redirect(`/admin/banners/edit/${id}?type=${detectAdType(req)}`);
    }
};

// --- 6. DESTROY (GET /admin/banners/delete/:id) ---
exports.destroy = async (req, res) => { 
    try {
        const { id } = req.params;
        const adType = detectAdType(req);
        const subfolder = adType === 'slider' ? 'sliders' : 'banners';
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const apiUrl = `${baseUrl}${apiPrefix}/admin/${subfolder}/${id}`; 
        
        await axios.delete(apiUrl, { headers: req.authHeaders }); 
        
        req.flash('success', `Xóa ${adType} thành công!`);
        res.redirect(`/admin/banners?type=${adType}`);
    } catch (error) {
        console.error(`Lỗi khi xóa Banner ID ${req.params.id}:`, error.message);
        const apiError = error.response?.data?.message || "Lỗi xóa banner.";
        
        req.flash('errors', [{ msg: apiError }]);
        res.redirect(`/admin/banners?type=${detectAdType(req)}`);
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