import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
        minLength: 2,
    },
    attachments: [String],

    userId: {
        type: mongoose.Types.ObjectId,
        ref: "user",
        required: true
    }
}, {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true }
})


const messageModel = mongoose.model.message || mongoose.model("message", messageSchema)

export default messageModel;