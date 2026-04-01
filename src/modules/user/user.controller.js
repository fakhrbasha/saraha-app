import { Router } from "express";
import * as US from './user.service.js'
import { authentication } from "../../middleware/authontication.js";
import { authorization } from "../../middleware/authorization.js";
import { RoleEnum } from "../../common/enum/user.enum.js";
import { multer_host, multer_local } from "../../middleware/multer.js";
import { multer_enum } from "../../common/enum/multer.enum.js";
import { validation } from "../../middleware/validation.middleware.js";
import { confirmEmailSchema, shareProfileSchema, signInSchema, signUpSchema, updatePasswordSchema, updateProfileSchema } from "./user.validation.js";
import messageRouter from "../message/message.controller.js";
const userRouter = Router({ caseSensitive: true, strict: true })
userRouter.use("/:userId/message", messageRouter)

userRouter.post('/signup', validation(signUpSchema), US.signUp)

userRouter.post("/upload-images", multer_host({
    custom_type: [...multer_enum.image]
}).fields([
    { name: "profile_picture", maxCount: 1 },
    { name: "cover_photos", maxCount: 2 }
]), authentication, US.uploadImages)

userRouter.post('/signup/gmail', US.signUpWithGmail)
userRouter.post('/confirm-email', validation(confirmEmailSchema), US.confirmEmail)
userRouter.post('/resend-otp', US.resendOtp)
userRouter.post('/forget-password', US.forgetPassword)
userRouter.post('/reset-password', US.resetPassword)
userRouter.post('/signin', validation(signInSchema), US.signIn)
userRouter.post('/enable-2fa', authentication, US.enable2FA)
userRouter.post('/confirm-2fa', authentication, US.confirm2FA)
userRouter.post('/confirm-login', US.confirmLogin)
userRouter.post('/logout', authentication, US.logout)
userRouter.get('/profile', authentication, authorization(RoleEnum.user), US.getProfile)
userRouter.get('/refresh-token', US.refreshToken)
userRouter.patch('/update-profile', validation(updateProfileSchema), authentication, US.updateProfile)
userRouter.patch('/update-password', validation(updatePasswordSchema), authentication, US.updatePassword)
userRouter.delete(
    "/profile-picture",
    authentication,
    US.removeProfileImage
)
userRouter.get('/share-profile/:id', validation(shareProfileSchema), US.shareProfile)
userRouter.get('/:id/profile', authentication, US.getProfileVisits)

export default userRouter;