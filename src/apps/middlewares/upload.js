const formidable = require("formidable");
const path = require("path");
const fs = require("fs");

// Tạo thư mục nếu chưa tồn tại
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const handleUpload = (subfolder, options = {}) => {
  const isMandatory = options.isMandatory !== undefined ? options.isMandatory : false; 
  const fileField = options.fileField || 'image'; 

  return (req, res, next) => {
    const uploadDir = path.join(
      __dirname,
      "..",
      "..",
      "public",
      "upload",
      subfolder
    );
    ensureDir(uploadDir);

    const form = new formidable.IncomingForm({
      multiples: false,
      maxFileSize: 5 * 1024 * 1024, // 5MB
      uploadDir: uploadDir,
      keepExtensions: true,
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        return res
          .status(400)
          .json({
            status: "error",
            message: "Error parsing form data",
            error: err.message,
          });
      }
      let file = files[fileField]; 
      if (Array.isArray(file) && file.length > 0) {
        file = file[0];
      }
      
      if (!file) {
          file = files.image || files.file; 
          if (Array.isArray(file) && file.length > 0) file = file[0];
      }
      const flattenedFields = Object.keys(fields).reduce((acc, key) => {
          const cleanKey = key.trim(); 
          acc[cleanKey] = Array.isArray(fields[key]) ? fields[key][0] : fields[key];
          return acc;
      }, {});

      // Kiểm tra file bắt buộc
      if (!file) {
        if (isMandatory) {
          return res.status(400).json({ message: "Image is required" });
        } 
        req.body = flattenedFields;
        return next();
      }

      // Xử lý đổi tên file và di chuyển
      const ext = path.extname(
        file.originalFilename || file.newFilename || file.name || ""
      );
      const newName = Date.now() + ext;
      const newPath = path.join(uploadDir, newName); 

      const oldPath = file.filepath || file.path || file.newFilename;

      try {
        fs.renameSync(oldPath, newPath);
      } catch (renameErr) {
        return res
          .status(500)
          .json({
            status: "error",
            message: "Error saving file",
            error: renameErr.message,
          });
      } 

      const imagePath = `/upload/${subfolder}/${newName}`;
      
      // set uploadedFile (thông tin file)
      req.uploadedFile = {
        filename: newName,
        path: imagePath,
        mimetype: file.mimetype || file.type || "",
      };

      req.body = { 
          ...flattenedFields, 
          image: imagePath   
      }; 

      next();
    });
  };
};

module.exports = {
  uploadProduct: handleUpload("products", { isMandatory: true }),
  uploadLogo: handleUpload("logo"),
  uploadSlider: handleUpload("sliders", { isMandatory: true }), 
  uploadBanner: handleUpload("banners", { isMandatory: true }),
};