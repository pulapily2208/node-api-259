const mongoose = require("../../common/init.mongo")();

const sliderSchema = new mongoose.Schema(
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

// Trỏ đến collection "sliders"
const SliderModel = mongoose.model("Sliders", sliderSchema, "sliders"); 
module.exports = SliderModel;