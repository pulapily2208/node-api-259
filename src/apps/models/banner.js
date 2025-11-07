const mongoose = require("../../common/init.mongo")();

const bannerSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      default: "#", 
    },
    target: {
      type: Boolean,
      default: false, 
    },
    position: {
      type: Number,
      default: 0, 
    },
    publish: {
      type: Boolean,
      default: false, 
    },
  },
  { timestamps: true }
);

const BannerModel = mongoose.model("Banners", bannerSchema, "banners");
module.exports = BannerModel;