import e from "express"
import userModel from "../../DB/models/user.model.js"
import { ProviderEnum } from "../../common/enum/user.enum.js"
import * as db_service from "../../DB/db.service.js"
import { successResponse } from "../../utils/response.success.js"
import { decrypt, encrypt } from "../../utils/security/encrypt_security.js"
import { generateToken, verifyToken } from "../../utils/token/jwt.js"
import { hashSync, compareSync } from 'bcrypt'
import { generateOTP } from "../../utils/mail/otp.js"
import { OAuth2Client } from "google-auth-library"
import { Compare, Hash } from "../../utils/security/hash.security.js"
import { ACCESS_SECRET_KEY, PREFIX, REFRESH_SECRET_KEY, SALT_ROUND } from "../../../config/config.service.js"
import joi from "joi"
import { randomUUID } from 'crypto'
import revokeTokenModel from "../../DB/models/revokeToken.model.js"
import { block_otp_key, del, exists, forgetPass, get, get_key, increment, Keys, loginBlock, loginFail, loginOtp, max_otp_key, otpKey, revoke_keys, setValue, ttl, twoFaKey } from "../../DB/models/redis/redis.service.js"
import cloudinary from "../../utils/cloudinary.js"
import { sendEmail, sendOtp } from "../../utils/mail/mail.js"
import { templateEmail } from "../../utils/mail/email.template.js"
import { eventEmitter } from "../../utils/mail/email.event.js"
import { emailEnum } from "../../common/enum/email.enum.js"

const sendEmailOtp = async (email, subject) => {

    const isBlocked = await ttl(block_otp_key(email))
    if (isBlocked > 0) {
        throw new Error(`you have exceeded the maximum number of attempts to resend otp please try again later after ${isBlocked} seconds`, { cause: 429 })
    }

    const otpTTl = await ttl(otpKey(email, subject))
    if (otpTTl > 0) {
        throw new Error(`you have already sent otp please check your email or try again later after ${otpTTl} seconds`, { cause: 429 })
    }

    const maxOtp = await get(max_otp_key(email))

    if (maxOtp >= 3) {
        await setValue({ key: block_otp_key(email), value: "blocked", ttl: 60 * 5 }) // to block user from resending otp for 5m if he exceeded the maximum number of attempts to resend otp and we can set ttl for it to automatically unblock user after 1 hour and when user try to resend otp we check if he is blocked by checking if block_otp_key exist in redis if it exist that means user is blocked and we can return error to user and if it not exist that means user is not blocked and we can allow him to resend otp and increment max_otp_key by 1 to count number of attempts to resend otp
        throw new Error(`you have exceeded the maximum number of attempts to resend otp please try again later after 300 seconds`, { cause: 429 })
    }

    const otp = await sendOtp()
    eventEmitter.emit(emailEnum.confirmedEmail, async () => {
        await sendEmail({
            to: email,
            subject: "hello To Saraha App",
            html: templateEmail(otp)
        })
    })

    await setValue({ key: otpKey(email, subject), value: Hash({ plan_text: `${otp}` }), ttl: 60 * 5 }) // to cache otp in redis for 5 minutes because otp is valid for 5 minutes and we can set ttl for it to automatically delete it after 5 minutes and when user try to confirm his email we check if otp is in redis if it is we compare it with otp that user send if they are equal that means otp is valid and we can confirm user email and delete otp from redis if they are not equal that means otp is invalid and we can return error to user and if otp is not in redis that means otp is expired and we can return error to user

    await increment(max_otp_key(email))

}
export const signUp = async (req, res, next) => {
    try {
        const { userName, email, password, age, gender, phone } = req.body
        const existUser = await db_service.findOne({ model: userModel, filter: { email } })
        if (existUser) {
            throw new Error("email already exist", { cause: 409 })
        }

        const user = await db_service.create({
            model: userModel,
            data: {
                userName,
                email,
                password: Hash({ plan_text: password, salt_round: SALT_ROUND }),
                age,
                gender,
                phone: phone ? encrypt(phone) : undefined,
                confirmed: false
            }
        })

        const otp = await sendOtp()
        await sendEmail({
            to: email,
            subject: "hello To Saraha App",
            html: templateEmail(otp)
        })

        await setValue({ key: otpKey({ email, subject: emailEnum.confirmedEmail }), value: Hash({ plan_text: `${otp}` }), ttl: 60 * 5 }) // to cache otp in redis for 5 minutes because otp is valid for 5 minutes and we can set ttl for it to automatically delete it after 5 minutes and when user try to confirm his email we check if otp is in redis if it is we compare it with otp that user send if they are equal that means otp is valid and we can confirm user email and delete otp from redis if they are not equal that means otp is invalid and we can return error to user and if otp is not in redis that means otp is expired and we can return error to user

        await setValue({ key: max_otp_key(email), value: 1, ttl: 30 })

        successResponse({
            res,
            status: 201,
            message: "user created successfully",
            data: user
        })
    } catch (error) {

        next(error)

    }
}
export const signUpWithGmail = async (req, res, next) => {
    const { idToken } = req.body



    const client = new OAuth2Client();
    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { name, email, email_verified, picture } = payload

        let user = await db_service.findOne({ model: userModel, filter: { email } })

        if (!user) {
            user = await db_service.create({ model: userModel, data: { userName: name, email, confirmed: email_verified, profilePicture: picture, provider: ProviderEnum.google } })
        }
        if (user.provider == ProviderEnum.system) {
            throw new Error("please logged in System Only", { cause: 400 })
        }
        const token = generateToken({ payload: { id: user._id, email: user.email } })
        successResponse({ res, message: "user signed in successfully", data: { ...user._doc, token } })

    } catch (err) {
        console.error('GOOGLE VERIFY ERROR:', err);
        return res.status(401).json({ message: 'Invalid Google token' });
    }
}

export const signIn = async (req, res, next) => {
    const { email, password } = req.body

    const isBlocked = await ttl(loginBlock(email))
    if (isBlocked > 0) {
        throw new Error(`you have exceeded the maximum number of attempts to login please try again later after ${isBlocked} seconds`, { cause: 429 })
    }

    const user = await db_service.findOne({ model: userModel, filter: { email, provider: ProviderEnum.system } })
    if (!user) {
        throw new Error("user not exist", { cause: 409 })
    }
    if (!compareSync(password, user.password)) {
        const fails = await increment(loginFail(email))

        if (fails >= 5) {
            await setValue({ key: loginBlock(email), value: 1, ttl: 60 * 5 }) // to block user from login for 5m if he exceeded the maximum number of attempts to login and we can set ttl for it to automatically unblock user after 5 minutes and when user try to login we check if he is blocked by checking if loginBlock key exist in redis if it exist that means user is blocked and we can return error to user and if it not exist that means user is not blocked and we can allow him to login and reset loginFail key to 0
            throw new Error(`you have exceeded the maximum number of attempts to login please try again later after 300 seconds`, { cause: 429 })
        }
        throw new Error("invalid password", { cause: 409 })
    }
    await del(loginFail(email)) // to reset login fail count in redis after successful login because when user login successfully we need to reset login fail count to 0 to allow him to login again and we can do that by deleting loginFail key from redis because when user try to login we check if loginFail key exist in redis if it exist that means there is a count of failed login attempts and we can reset it by deleting the key and when user try to login again if he enter wrong password we will create loginFail key in redis with value 1 and increment it for each failed attempt and if it reach 5 we will block user by creating loginBlock key in redis and set ttl for it to automatically unblock user after certain time

    if (user.twoStepEnabled) {

        const otp = await sendOtp()

        await sendEmail({
            to: email,
            subject: "Login OTP",
            html: templateEmail(otp)
        })

        await setValue({
            key: loginOtp(email),
            value: Hash({ plan_text: `${otp}` }),
            ttl: 60 * 20
        })

        return res.json({
            message: "OTP sent, complete login with OTP"
        })
    }

    const jwtid = randomUUID() // to generate unique id for each token to be able to revoke it by this id   
    const Access_token = generateToken({ payload: { id: user._id }, secretKey: ACCESS_SECRET_KEY, options: { expiresIn: 60 * 5, jwtid } })
    const refresh_token = generateToken({ payload: { id: user._id }, secretKey: REFRESH_SECRET_KEY, options: { expiresIn: "1y", jwtid } })


    successResponse({ res, message: "user signed in successfully", data: { ...user._doc, Access_token, refresh_token } })

}


export const confirmEmail = async (req, res, next) => {
    try {
        const { otp, email } = req.body
        const otpValue = await get(otpKey(email))
        if (!otpValue) {
            throw new Error("otp expired", { cause: 400 })
        }
        if (!Compare({ plan_text: otp, cipher_text: otpValue })) {
            throw new Error("invalid otp", { cause: 400 })
        }
        const user = await db_service.findOneAndUpdate({
            model: userModel,
            filter: { email, confirmed: false },
            update: { confirmed: true, expiresAt: null },
            options: { new: true }
        })
        if (!user) {
            throw new Error("user not exist or already confirmed", { cause: 409 })
        }
        await del(otpKey(email)) // to delete otp from redis after successful confirmation because when user confirm his email we don't need otp in redis anymore and we can delete it to save space in redis
        successResponse({
            res,
            message: "email confirmed successfully",
        })
    } catch (error) {
        next(error)
    }
}

export const resendOtp = async (req, res, next) => {
    try {
        const { email } = req.body
        const user = await db_service.findOne({
            model: userModel,
            filter: { email, confirmed: false },
        })
        if (!user) {
            throw new Error("user not exist or already confirmed", { cause: 409 })
        }

        await sendEmailOtp({ email, subject: emailEnum.confirmedEmail })

        successResponse({
            message: "otp resent successfully",
            res
        })
    } catch (error) {
        next(error)
    }
}

export const enable2FA = async (req, res, next) => {
    const email = req.user.email

    const otp = await sendOtp()

    await sendEmail({
        to: email,
        subject: "Enable 2FA",
        html: `Your OTP is ${otp}`
    })

    await setValue({
        key: twoFaKey(email),
        value: Hash({ plan_text: `${otp}` }),
        ttl: 60 * 20
    })

    successResponse({
        res,
        message: "OTP sent to enable 2FA"
    })
}

export const confirm2FA = async (req, res, next) => {
    const { otp } = req.body
    const email = req.user.email

    const stored = await get(twoFaKey(email))

    if (!stored) {
        throw new Error("otp expired")
    }

    if (!Compare({ plan_text: otp, cipher_text: stored })) {
        throw new Error("invalid otp")
    }

    await db_service.findOneAndUpdate({
        model: userModel,
        filter: { email },
        update: { twoStepEnabled: true, expiresAt: null },
    })

    await del(twoFaKey(email))

    successResponse({
        res,
        message: "2FA enabled successfully"
    })
}



export const confirmLogin = async (req, res, next) => {
    const { email, otp } = req.body

    const stored = await get(loginOtp(email))

    if (!stored) {
        throw new Error("otp expired")
    }

    if (!Compare({ plan_text: otp, cipher_text: stored })) {
        throw new Error("invalid otp")
    }

    const user = await db_service.findOne({
        model: userModel,
        filter: { email }
    })

    const jwtid = randomUUID()

    const Access_token = generateToken({
        payload: { id: user._id },
        secretKey: ACCESS_SECRET_KEY,
        options: { expiresIn: 60 * 20, jwtid }
    })

    const refresh_token = generateToken({
        payload: { id: user._id },
        secretKey: REFRESH_SECRET_KEY,
        options: { expiresIn: "1y", jwtid }
    })

    await del(loginOtp(email))

    successResponse({
        res,
        message: "login success",
        data: { Access_token, refresh_token }
    })
}



export const getProfile = async (req, res, next) => {
    // cash profile
    const key = `profile::${req.user._id}`
    const userExist = await get(key)
    if (userExist) {
        return successResponse({ res, message: "user profile retrieved successfully", data: userExist })
    }
    await setValue({ key, value: req.user, ttl: 60 }) // to cache user profile in redis for 60 seconds to reduce the load on database and improve performance because user profile is accessed frequently and it doesn't change frequently so we can cache it in redis and set ttl for it to automatically delete it after 60 seconds and when user try to access his profile again we check if it's in redis if it is we return it from redis if not we get it from database and cache it in redis again

    const visits = await increment(`profile_visits::${req.user._id}`) // to count number of visits for user profile by incrementing the value in redis for each visit and we can use this data to show it to user or for analytics or to detect any attack if we see a sudden increase in number of visits for user profile that means there is an attack and we can take action to prevent it
    successResponse({ res, message: "user profile retrieved successfully", data: req.user, visits })

}

export const refreshToken = async (req, res, next) => {
    const { authorization } = req.headers
    if (!authorization) {
        throw new Error("token required", { cause: 401 })
    }
    const [prefix, token] = authorization.split(" ") // Bearer token
    if (prefix !== PREFIX || !token) {
        throw new Error("invalid token format", { cause: 401 })
    }
    const decoded = verifyToken({ token, secretKey: REFRESH_SECRET_KEY })
    if (!decoded || !decoded.id) {
        throw new Error("invalid token", { cause: 401 })
    }

    const user = await db_service.findOne({ model: userModel, filter: { _id: decoded.id } })

    if (!user) {
        throw new Error("user not exist", { cause: 409 })
    }
    const revokeToken = await db_service.findOne({ model: revokeTokenModel, filter: { tokenId: decoded.jti } })
    if (revokeToken) {
        throw new Error("token revoked", { cause: 401 })
    }
    // then generate new access token
    const Access_token = generateToken({ payload: { id: user._id }, secretKey: ACCESS_SECRET_KEY, options: { expiresIn: 60 * 5 } })
    successResponse({ res, message: "access token refreshed successfully", data: { Access_token } })
}

export const shareProfile = async (req, res, next) => {

    const { id } = req.params

    const user = await db_service.findById({ model: userModel, id, select: '-password' })
    if (!user) {
        throw new Error("user not exist", { cause: 409 })
    }
    user.phone = decrypt(user.phone)
    successResponse({ res, message: "user profile retrieved successfully", data: user })
}

export const updateProfile = async (req, res, next) => {
    // const { id } = req.user
    let { firstName, lastName, gender, phone } = req.body

    if (phone) {
        phone = encrypt(phone)
    }

    const user = await db_service.findOneAndUpdate({ model: userModel, filter: { _id: req.user._id }, update: { firstName, lastName, gender, phone } })
    if (!user) {
        throw new Error("user not exist", { cause: 409 })
    }
    await del(`profile::${req.user._id}`) // to delete user profile from redis when update it to get updated profile from database when user try to access his profile again because when user update his profile we need to delete the old profile from redis to get updated profile from database when user try to access his profile again and we can set ttl for user profile in redis to automatically delete it after certain time to get updated profile from database when user try to access his profile again because user profile is accessed frequently and it doesn't change frequently so we can cache it in redis and set ttl for it to automatically delete it after certain time and when user try to access his profile again we check if it's in redis if it is we return it from redis if not we get it from database and cache it in redis again
    successResponse({ res, message: "user profile updated successfully", data: user })
}

export const updatePassword = async (req, res, next) => {
    const { oldPassword, newPassword } = req.body

    if (!Compare({ plan_text: oldPassword, cipher_text: req.user.password })) {
        throw new Error("invalid current password", { cause: 400 })
    }

    const hash = Hash({ plan_text: newPassword, salt_round: SALT_ROUND })

    req.user.password = hash

    await req.user.save()

    successResponse({ res, message: "user password updated successfully" })
}
export const logout = async (req, res, next) => {

    const { flag } = req.query
    if (flag === "all") {
        req.user.changeCredential = new Date() // to invalidate all tokens issued before this time because when user logout we need to invalidate all tokens issued before logout time to prevent any attack from old tokens and we can do that by adding changeCredential field to user model and when user logout we update this field with current time and when user try to access any protected route we compare the changeCredential time with the iat time in token if changeCredential time is greater than iat time that means token is invalid because it was issued before logout time
        await req.user.save()

        await del(await Keys(get_key({ userId: req.user._id }))) // to delete all revoked tokens for this user from redis because when user logout we need to invalidate all tokens issued before logout time to prevent any attack from old tokens and we can do that by adding changeCredential field to user model and when user logout we update this field with current time and when user try to access any protected route we compare the changeCredential time with the iat time in token if changeCredential time is greater than iat time that means token is invalid because it was issued before logout time so we don't need to keep revoked tokens in database because they will be automatically invalid by changeCredential field and we can delete them from database to save space

    } else {

        await setValue({
            key: revoke_keys({ userid: req.user._id, jti: req.decoded.jti }),
            value: `${req.decoded.jti}`,
            ttl: req.decoded.exp - Math.floor(Date.now() / 1000) // to set ttl for revoked token in redis to automatically delete it after expire time and we can calculate ttl by subtracting current time from token expire time because both times are in seconds since epoch
        })
    }


    successResponse({ res, message: "user logged out successfully" })
}

export const getProfileVisits = async (req, res, next) => {

    const { id } = req.params

    const visits = await get(`profile_visits::${id}`)

    successResponse({
        res,
        message: "profile visits retrieved",
        data: {
            visits: Number(visits) || 0
        }
    })
}


export const uploadImages = async (req, res, next) => {

    let uploadedImages = []

    try {

        const user = await db_service.findOne({
            model: userModel,
            filter: { _id: req.user._id }
        })

        if (!user) {
            throw new Error("user not found", { cause: 404 })
        }
        if (req.files?.profile_picture) {
            const file = req.files.profile_picture[0]
            const uploaded = await cloudinary.uploader.upload(file.path, {
                folder: "sarahaApp/users/profile"
            })
            const newProfile = {
                public_id: uploaded.public_id,
                secure_url: uploaded.secure_url
            }
            uploadedImages.push(uploaded.public_id)

            if (user.profilePicture?.public_id) {
                user.gallery.push(user.profilePicture)
            }

            user.profilePicture = newProfile

            // delete local file
            fs.unlinkSync(file.path)
        }

        // cover photo
        if (req.files?.cover_photos) {

            const existing = user.coverPhotos?.length || 0
            const uploadedCount = req.files.cover_photos.length

            if (existing + uploadedCount !== 2) {
                throw new Error("cover photos must equal 2", { cause: 400 })
            }

            let covers = []

            for (const file of req.files.cover_photos) {

                const uploaded = await cloudinary.uploader.upload(file.path, {
                    folder: "sarahaApp/users/covers"
                })

                covers.push({
                    public_id: uploaded.public_id,
                    secure_url: uploaded.secure_url
                })

                uploadedImages.push(uploaded.public_id)

                fs.unlinkSync(file.path)
            }

            user.coverPhotos = [...(user.coverPhotos || []), ...covers]
        }

        await user.save()

        res.status(200).json({
            message: "images uploaded successfully",
            data: user
        })

    } catch (error) {
        for (const id of uploadedImages) {
            await cloudinary.uploader.destroy(id)
        }

        next(error)
    }
}
export const removeProfileImage = async (req, res, next) => {

    try {

        const user = await db_service.findOne({
            model: userModel,
            filter: { _id: req.user._id }
        })

        if (!user.profilePicture) {
            throw new Error("No profile picture found", { cause: 404 })
        }

        await cloudinary.uploader.destroy(user.profilePicture.public_id)

        const updatedUser = await db_service.findOneAndUpdate({
            model: userModel,
            filter: { _id: req.user._id },
            update: {
                $unset: { profilePicture: 1 }
            },
            options: { new: true }
        })

        res.status(200).json({
            message: "profile image removed",
            data: updatedUser
        })

    } catch (error) {
        next(error)
    }
}

// forget pass

export const forgetPassword = async (req, res, next) => {
    const { email } = req.body

    const user = await db_service.findOne({ model: userModel, filter: { email, confirmed: true, provider: ProviderEnum.system } })
    if (!user) {
        throw new Error("user not exist", { cause: 409 })
    }

    await sendEmailOtp(email, emailEnum.forgetPassword)
    // const otp = await sendOtp()
    // await sendEmail({
    //     to: email,
    //     subject: "Reset Your Password",
    //     html: `Your password reset code is ${otp}`
    // })
    // await setValue({ key: forgetPass(email), value: Hash({ plan_text: `${otp}` }), ttl: 60 * 5 }) // to cache otp in redis for 5 minutes because otp is valid for 5 minutes and we can set ttl for it to automatically delete it after 5 minutes and when user try to reset his password we check if otp is in redis if it is we compare it with otp that user send if they are equal that means otp is valid and we can allow user to reset his password and delete otp from redis if they are not equal that means otp is invalid and we can return error to user and if otp is not in redis that means otp is expired and we can return error to user

    successResponse({
        res,
        message: "password reset otp sent to email successfully"
    })
}
export const resetPassword = async (req, res, next) => {
    const { email, otp, newPassword } = req.body
    const otpValue = await get(otpKey(email, emailEnum.forgetPassword))
    if (!otpValue) {
        throw new Error("otp expired", { cause: 400 })
    }
    if (!Compare({ plan_text: otp, cipher_text: otpValue })) {
        throw new Error("invalid otp", { cause: 400 })
    }

    const hash = Hash({ plan_text: newPassword, salt_round: SALT_ROUND })

    const newPass = await db_service.findOneAndUpdate({ model: userModel, filter: { email }, update: { password: hash, changeCredential: new Date() } })
    await del(forgetPass(email)) // to delete otp from redis after successful password reset because when user reset his password we don't need otp in redis anymore and we can delete it to save space in redis

    successResponse({ res, message: "Password reset success" })
}