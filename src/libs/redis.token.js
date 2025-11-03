const clientRedis = require("../common/init.redis");
const TokenModel = require("../apps/models/token");
const {jwtDecode} = require ("jwt-decode");
exports.addTokenBlackList = async (customerId) => {
    // Add cả accessToken và refreshToken
    const token = await TokenModel.findOne({customerId});
    if (!token) {
        const error = new Error("No Token found this customer");
        error.statusCode = 404;
        throw error;
    }
    const { accessToken, refreshToken } = token;
    // Move accessToken to Redis - đưa những thằng nào còn thời gian sống vào redis
    const decodedAccessToken = jwtDecode(accessToken);
    if (decodedAccessToken.exp > Date.now() / 1000) {
        await clientRedis.set(
            `tb_${accessToken}`, // key
            "revoked", // không còn hợp lệ
            {
                EXAT: decodedAccessToken.exp // thời gian hết hạn 
            }
        )
    }
    // Move refreshToken to Redis - đưa những thằng nào còn thời gian sống vào redis
    const decodedRefreshToken = jwtDecode(refreshToken);
    if (decodedRefreshToken.exp > Date.now() / 1000) {
        await clientRedis.set(
            `tb_${refreshToken}`, // key
            "revoked", // không còn hợp lệ
            { EXAT: decodedRefreshToken.exp }// thời gian hết hạn 
        );
    }
};