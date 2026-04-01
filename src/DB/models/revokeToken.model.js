import mongoose from "mongoose";

const revokeTokenSchema = new mongoose.Schema({
    tokenId: {
        type: String,
        required: true,
        trim: true

    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    expireAt: {
        type: Date,
        required: true,
    },

}, {
    timestamps: true,
    strictQuery: true, // when true, Mongoose will only save fields that are defined in the schema. Any fields that are not defined in the schema will be ignored and not saved to the database.
})

revokeTokenSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 }) // to automatically delete expired tokens from the database after expireAt time and we need to set expireAfterSeconds to 0 to delete the document immediately after expireAt time
const revokeTokenModel = mongoose.model("revokeToken", revokeTokenSchema)

export default revokeTokenModel;