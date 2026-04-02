import { resolve } from "node:path"
import dotenv from "dotenv";



const NODE_ENV = process.env.NODE_ENV


let NODE_PATH = {
    development: ".env.development",
    production: ".env.production"
}
dotenv.config({ path: resolve(`config/${NODE_PATH[NODE_ENV]}`) })

export const PORT = +process.env.PORT

export const SALT_ROUND = +process.env.SALT_ROUND
export const DB_URI = process.env.DB_URI
export const DB_URI_ONLINE = process.env.DB_URI_ONLINE
export const ACCESS_SECRET_KEY = process.env.ACCESS_SECRET_KEY
export const REFRESH_SECRET_KEY = process.env.REFRESH_SECRET_KEY
export const PREFIX = process.env.PREFIX
export const REDIS_URL = process.env.REDIS_URL
export const GMAIL_USER = process.env.GMAIL_USER
export const GMAIL_PASS = process.env.GMAIL_PASS
export const WHITE_CORS = process.env.WHITE_CORS.split(",") || []
export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET