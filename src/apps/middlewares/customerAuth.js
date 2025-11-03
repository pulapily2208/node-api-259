const CustomerModel = require("../models/customer");
const redisClient = require("../../common/init.redis");
const jwt = require("jsonwebtoken");
const config = require("config");
exports.verifyAccessToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
      return res.status(401).json({
        status: "error",
        message: "Access token is required",
      });
    // Check token in redis
    const isTokenBlacklist = await redisClient.get(`tb_${token}`);
    if (isTokenBlacklist) return res.status(401).json({
      status: "error",
      message: "Access token is revoked",
    })
    jwt.verify(token, config.get("app.jwtAccessKey"), async (err, decoded) => {
      if (err) {
        if (err.name === "TokenExpiredError")
          return res.status(401).json({
            status: "error",
            message: "Access token expired",
          });
        return res.status(401).json({
          status: "error",
          message: "Invalid access token",
        });
      }

      const customer = await CustomerModel.findById(decoded.id).select(
        "-password"
      );
      console.log(decoded);

      req.customer = customer;
      next();
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
};
exports.verifyRefreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token)
      res.status(401).json({
        status: "error",
        message: "Refresh token is required",
      });
    jwt.verify(token, config.get("app.jwtRefreshKey"), async (err, decoded) => {
      if (err) {
        if (err.name === "TokenExpiredError")
          return res.status(401).json({
            status: "error",
            message: "Refersh token expired",
          });

        return res.status(401).json({
          status: "error",
          message: "Invalid refresh token",
        });
      }
      req.customer = decoded;
      next();
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
};
