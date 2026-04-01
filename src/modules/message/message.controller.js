import { Router } from "express";
import * as MV from "./message.validation.js";
import * as MS from "./message.service.js";
import { multer_local } from "../../middleware/multer.js";
import { multer_enum } from "../../common/enum/multer.enum.js";
import { validation } from "../../middleware/validation.middleware.js";
import { authentication } from "../../middleware/authontication.js";

const messageRouter = Router({ mergeParams: true })

messageRouter.post('/send',
    multer_local(
        {
            custom_path: "messages",
            custom_type: multer_enum.image
        }
    ).array("attachments", 3),
    validation(MV.sendMessageSchema),
    MS.sendMessage

)
messageRouter.get('/me', authentication, MS.getMessages)


messageRouter.get('/:messageId', authentication, validation(MV.getMessageSchema), MS.getMessage)





export default messageRouter