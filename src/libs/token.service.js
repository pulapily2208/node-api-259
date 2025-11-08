const TokenModel = require("../apps/models/token");
const  {addTokenBlackList} = require ("./redis.token");

exports.storeCustomerToken = async (customerId, accessToken, refreshToken) => {
    const token = await TokenModel.findOne({customerId});
    if (token) this.deleteCustomerToken(customerId);
    await TokenModel({
        customerId, 
        accessToken, 
        refreshToken
    }).save();
};

exports.deleteCustomerToken = async (customerId) => {
    const token = await TokenModel.findOne({customerId});
    if (!token) {
        const error = new Error("No Token found this customer");
        error.statusCode = 404;
        throw error;
    }

    // Move Token to Redis 
    await addTokenBlackList ( customerId);
    // Delete Token from db
    await TokenModel.deleteOne({customerId});
};

exports.storeUserToken = async (userId, accessToken, refreshToken) => {
    const token = await TokenModel.findOne({customerId: userId});
    if (token) await exports.deleteUserToken(userId);
    await TokenModel({
        customerId: userId,
        accessToken, 
        refreshToken
    }).save();
};

exports.deleteUserToken = async (userId) => {
    const token = await TokenModel.findOne({customerId: userId});
    if (!token) {
        const error = new Error("No Token found this user");
        error.statusCode = 404;
        throw error;
    }
    await addTokenBlackList(userId);
    await TokenModel.deleteOne({customerId: userId});
};