import joi from "joi";
import { Types } from "mongoose";

export const general_rules = {



    email: joi.string().email(),
    // i need all without outlook
    // email: joi.string().email({ tlds: { allow: false, deny: ["outlook"] } }).required(),
    password: joi.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/),
    cPassword: joi.string().valid(joi.ref("password")), // to make sure that confirm password match password
    // id: joi.string().uuid().length(24).hex().required(),

    id: joi.string().custom((value, helper) => {
        const isValid = Types.ObjectId.isValid(value)
        return isValid ? value : helper.message("invalid id format")
    })
    ,
    file: joi.object({
        fieldname: joi.string(),
        originalname: joi.string(),
        encoding: joi.string(),
        mimetype: joi.string(),
        destination: joi.string(),
        filename: joi.string(),
        path: joi.string(),
        size: joi.number(),
    }).messages({
        "any.required": "avatar is required",
        "object.base": "avatar must be a file"
    }),
}