const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SettingSchema = new Schema(
  {
    shop_name: {
      type: String,
      default: "Vietpro Shop"
    },
    thumbnail_logo: {
      type: String,
      default: "logo/default-logo.png"
    },
    description: {
      type: String,
      default: ""
    },
    copyright: {
      type: String,
      default: "© 2025 MyWebsite. All rights reserved."
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Setting", SettingSchema, "settings");
