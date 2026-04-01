import mongoose from "mongoose";
import { RoleEnum, GenderEnum, ProviderEnum } from "../../common/enum/user.enum.js";

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        minLength: 3,
        maxLength: 20,
        trim: true
    },

    lastName: {
        type: String,
        minLength: 3,
        maxLength: 20,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    password: {
        type: String,
        required: function () {
            return this.provider == ProviderEnum.system
        },
        minLength: 6
    },

    age: Number,

    gender: {
        type: String,
        enum: Object.values(GenderEnum),
        default: GenderEnum.male
    },

    phone: {
        type: String,
        required: function () {
            return this.provider == ProviderEnum.system
        }
    },

    profilePicture: {
        secure_url: String,
        public_id: String
    },

    coverPhotos: [
        {
            secure_url: String,
            public_id: String
        }
    ],

    gallery: [
        {
            secure_url: String,
            public_id: String
        }
    ],

    changeCredential: Date,

    confirmed: {
        type: Boolean,
        default: false
    },

    twoStepEnabled: {
        type: Boolean,
        default: false
    },

    expiresAt: {
        type: Date,
        default: function () {
            return this.confirmed ? null : Date.now() + 24 * 60 * 60 * 1000
        },
        index: { expires: 0 }
    },

    provider: {
        type: String,
        enum: Object.values(ProviderEnum),
        default: ProviderEnum.system
    },

    role: {
        type: String,
        enum: Object.values(RoleEnum),
        default: RoleEnum.user
    }

}, {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true }
})

userSchema.virtual('userName')
    .get(function () {
        return this.firstName + " " + this.lastName
    }).set(function (value) {
        const [firstName, lastName] = value.split(" ")
        this.set({ firstName, lastName })
    })


const userModel = mongoose.model.user || mongoose.model("user", userSchema)

export default userModel;