import joi from "joi"
import { GenderEnum } from "../../common/enum/user.enum.js";
import { general_rules } from "../../utils/generalRules.js";


export const signUpSchema = {
    body: joi.object({
        userName: joi.string().required(),
        // userName: joi.string().not("ahmed").required(), // anyone neither ahmed
        // i need add another mails  
        // email: joi.string().email({ tlds: { allow: ["org", "outlook"] }, maxDomainSegments: 2 }).required(),
        email: general_rules.email.required(),
        // i need all without outlook
        // email: joi.string().email({ tlds: { allow: false, deny: ["outlook"] } }).required(),
        password: general_rules.password.required(),
        cPassword: general_rules.cPassword.required(),
        phone: joi.string().required(),
        gender: joi.string().valid(...Object.values(GenderEnum)).required(), // valid [male , female]
        confirmed: joi.boolean().truthy("yes", "y", 1).falsy("no", "n", 0).sensitive() // must n small

        // active: joi.boolean().truthy("yes", "y", 1).falsy("no", "n", 0).sensitive() // must n small
    }),
    // file: general_rules.file.required(),// to validate file that come from multer because multer add file to req and the name of it is file and it contain all information about file like path and originalname and mimetype and size and etc
    // files: general_rules.files.required() // to validate multiple files that come from multer because multer add files to req and the name of it is files and it contain all information about files like path and originalname and mimetype and size and etc
    // to validate file that come from multer because multer add file to req and the name of it is file and it contain all information about file like path and originalname and mimetype and size and etc


    // files: joi.array().max(3).items(general_rules.file.required()).required() // to validate multiple files that come from multer because multer add files to req and the name of it is files and it contain all information about files like path and originalname and mimetype and size and etc
    // files: joi.object({
    //     avatar: joi.array().max(1).items(general_rules.file.required()).required(),
    //     coverPhotos: joi.array().max(2).items(general_rules.file.required()).required()
    // })
    // files: joi.object(
    //     {
    //         avatar: joi.array().max(1).items(
    //             joi.object(
    //                 {
    //                     fieldname: joi.string().required(),
    //                     originalname: joi.string().required(),
    //                     encoding: joi.string().required(),
    //                     mimetype: joi.string().required(),
    //                     destination: joi.string().required(),
    //                     filename: joi.string().required(),
    //                     path: joi.string().required(),
    //                     size: joi.number().required()
    //                 }).required().messages({
    //                     "any.required": "avatar is required",
    //                     "object.base": "avatar must be a file"
    //                 })
    //             // to validate multiple files that come from multer because multer add files to req and the name of it is files and it contain all information about files like path and originalname and mimetype and size and etc
    //         ).required(),
    //         avatars: joi.array().max(3).items(
    //             joi.object(
    //                 {
    //                     fieldname: joi.string().required(),
    //                     originalname: joi.string().required(),
    //                     encoding: joi.string().required(),
    //                     mimetype: joi.string().required(),
    //                     destination: joi.string().required(),
    //                     filename: joi.string().required(),
    //                     path: joi.string().required(),
    //                     size: joi.number().required()
    //                 }).required().messages({
    //                     "any.required": "avatar is required",
    //                     "object.base": "avatar must be a file"
    //                 })
    //             // to validate multiple files that come from multer because multer add files to req and the name of it is files and it contain all information about files like path and originalname and mimetype and size and etc
    //         ).required(),

    //     }
    // )

    // query: joi.object({
    //     flag: joi.boolean().required()
    // })
}

export const signInSchema = {
    body: joi.object({
        email: joi.string().email().required(),
        password: joi.string().required(),
    })
}
export const shareProfileSchema =
{
    params: joi.object({
        id: general_rules.id.required()
    }).required()
}

export const updateProfileSchema = {
    body: joi.object({
        firstName: joi.string(),
        lastName: joi.string(),
        gender: joi.string().valid(...Object.values(GenderEnum)),
        phone: joi.string()
    })
}
export const updatePasswordSchema = {
    body: joi.object({
        oldPassword: general_rules.password.required(),
        newPassword: general_rules.password.required(),
        cPassword: joi.string().valid(joi.ref("newPassword")).required().messages({
            "any.only": "cPassword must be the same as newPassword"
        })
    })
}

export const confirmEmailSchema = {
    body: joi.object({
        email: general_rules.email.required(),
        otp: joi.string().length(6).required()
    })
}