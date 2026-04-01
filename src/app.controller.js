import express from 'express'
import checkConnectionDb from './DB/connectionDB.js'
import userRouter from './modules/user/user.controller.js'


// import { resolve } from "node:path"
// dotenv.config({ path: resolve("config/.env.development") })
// dotenv.config({path}) this path to make import correct path


const app = express()
import cors from 'cors'
import dotenv from "dotenv";
import { PORT, WHITE_CORS } from '../config/config.service.js'
import { redisConnection } from './DB/models/redis/redis.db.js'
import messageRouter from './modules/message/message.controller.js'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
dotenv.config();

const port = PORT

// cors : to allow uri access api 
// cors of postman undefined


// to make limit for your request use package express rate limiter



const bootstrap = () => {
    const limit = rateLimit({
        windowMs: 60 * 5 * 1000, // time with ms
        limit: 10,
        message: "game over",
        statusCode: 400,
        requestPropertyName: "rate_limit",
        handler: (req, res, next) => {
            return res.status(401).json({ Message: "game over" })
            //             {
            //     "Message": "game over"
            // }
        },
        // legacyHeaders: false // to hidden whit time can send request

        // X-RateLimit-Limit
        // 3
        // X-RateLimit-Remaining
        // 0
        // Date
        // Tue, 31 Mar 2026 20:52:11 GMT
        // X-RateLimit-Reset
        // 1774990622
        // Retry-After
        // 291 sec


    })

    const corsOptions = {
        origin: function (origin, callback) {

            if ([...WHITE_CORS, undefined].includes(origin)) {
                callback(null, true)
            } else {
                callback(new Error("not allow by cors"))
            }
        }
    }

    app.use(cors(corsOptions), helmet(), limit, express.json())
    checkConnectionDb()
    // redis connection
    redisConnection()


    app.use("/upload", express.static("upload")) // to make upload folder public to access it from url http://localhost:4000/users/filename
    // http://localhost:4000/upload/users/1772564292968-586802944__2.png


    app.get('/', (req, res) => {
        return res.status(200).json({ message: 'Welcome to Saraha App' })
    })
    app.use('/users', userRouter)
    app.use('/message', messageRouter)

    app.use('{/*demo}', (req, res, next) => {
        // return res.status(404).json({ message: `Url ${req.originalUrl} not found` })
        throw new Error(`Url ${req.originalUrl} not found`, { cause: 404 })
    })


    // global error handler

    app.use((err, req, res, next) => {
        return res.status(err.cause || 500).json({ message: err.message, stack: err.stack })
    })

    app.listen(port, () => console.log(`app listening on port ${port}!`))
}
export default bootstrap;