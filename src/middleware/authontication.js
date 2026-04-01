import { ACCESS_SECRET_KEY, PREFIX } from "../../config/config.service.js";
import * as db_service from "../DB/db.service.js";
import { get, revoke_keys } from "../DB/models/redis/redis.service.js";
import revokeTokenModel from "../DB/models/revokeToken.model.js";
import userModel from "../DB/models/user.model.js";
import { verifyToken } from "../utils/token/jwt.js";

export const authentication = async (req, res, next) => {
    const { authorization } = req.headers
    if (!authorization) {
        throw new Error("token required", { cause: 401 })
    }
    const [prefix, token] = authorization.split(" ") // Bearer token
    if (prefix !== PREFIX || !token) {
        throw new Error("invalid token format", { cause: 401 })
    }
    const decoded = verifyToken({ token, secretKey: ACCESS_SECRET_KEY })
    if (!decoded || !decoded.id) {
        throw new Error("invalid token", { cause: 401 })
    }
    // console.log(decoded);
    // req walk in all the middlewares and controllers with the decoded data
    const user = await db_service.findOne({ model: userModel, filter: { _id: decoded.id } })

    if (!user) {
        throw new Error("user not exist", { cause: 409 })
    }
    // getTime to convert date in ms and iat in token is in seconds so we need to multiply it by 1000 to convert it to ms
    if (user?.changeCredential?.getTime() > decoded.iat * 1000) {
        throw new Error("token expired", { cause: 401 })
    }

    // const revokeToken = await db_service.findOne({ model: revokeTokenModel, filter: { tokenId: decoded.jti } })
    const revokeToken = await get(revoke_keys({ userid: decoded.id, jti: decoded.jti }))
    if (revokeToken) {
        throw new Error("invalid token revoked", { cause: 401 })
    }
    req.user = user
    req.decoded = decoded
    next()

}