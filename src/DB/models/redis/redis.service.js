import { emailEnum } from "../../../common/enum/email.enum.js";
import { redisClient } from "./redis.db.js";


export const revoke_keys = ({ userid, jti }) => {
    return `revoke_token::${userid}::${jti}`
}
export const get_key = ({ userId }) => {
    return `revoke_token::${userId}`
}

export const otpKey = (email, subject = emailEnum.confirmedEmail) => {
    return `otp::${email}::${subject}`
}

export const max_otp_key = (email) => {
    return `${otpKey(email)}::max`
}
export const block_otp_key = (email) => {
    return `${otpKey(email)}::block`
}
export const forgetPass = (email) => {
    return `forget_password_otp::${email}`
}

export const loginFail = (email) => {
    return `login_fail::${email}`
}
export const loginBlock = (email) => {
    return `login_block::${email}`
}
export const twoFaKey = (email) => {
    return `2fa:${email}`
}
export const loginOtp = (email) => {
    return `login_otp:${email}`
}
export const increment = async (key) => {
    try {
        return await redisClient.incr(key)
    } catch (error) {
        console.log("error increment redis", error)
    }
}

export const setValue = async ({ key, value, ttl } = {}) => {
    try {
        const data = typeof value === 'string' ? value : JSON.stringify(value)
        return ttl ? await redisClient.setEx(key, ttl, data) : await redisClient.set(key, data)
    } catch (error) {
        console.log("error to set data in redis", error);
    }
}

export const update = async ({ key, value, ttl } = {}) => {
    try {
        if (!await redisClient.exists(key)) {
            return 0
        }
        return await setValue({ key, value, ttl })
    } catch (error) {
        console.log("error to update data in redis", error);
    }
}

export const get = async (key) => {
    try {
        try {
            // iof need data stringify it to json if it's not string if object convert to string if not return direct
            return JSON.parse(await redisClient.get(key))
        } catch (error) {
            return await redisClient.get(key)
        }
    } catch (error) {
        console.log("error to get data from redis", error);
    }
}
export const Mget = async (key) => {
    try {
        try {
            // iof need data stringify it to json if it's not string if object convert to string if not return direct
            return JSON.parse(await redisClient.mGet(key))
        } catch (error) {
            return await redisClient.mGet(key)
        }
    } catch (error) {
        console.log("error to get data from redis", error);
    }
}
export const ttl = async (key) => {
    try {
        return await redisClient.ttl(key)
    } catch (error) {
        console.log("error to set ttl for data in redis", error);
    }
}
export const del = async (key) => {
    try {
        if (!key.length) return 0
        return await redisClient.del(key)
    } catch (error) {
        console.log("error to delete data from redis", error);
    }
}

export const Keys = async (pattern) => {
    try {
        return await redisClient.keys(`${pattern}*`)
    } catch (error) {
        console.log("error to get keys from redis", error);
    }
}
export const exists = async (key) => {
    try {
        return await redisClient.exists(key)
    } catch (error) {
        console.log("error to check if key exists in redis", error);
    }
}

export const expire = async (key, ttl) => {
    try {
        return await redisClient.expire(key, ttl)
    } catch (error) {
        console.log("error to set ttl for data in redis", error);
    }
}
// expire age 10