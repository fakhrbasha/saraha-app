import { EventEmitter } from "node:events";
import { emailEnum } from "../../common/enum/email.enum.js";

export const eventEmitter = new EventEmitter()

eventEmitter.on(emailEnum.confirmedEmail, async (fn) => {
    await fn()
})