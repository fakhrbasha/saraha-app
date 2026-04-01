// import pkg from 'jsonwebtoken';
// const { sign, verify } = pkg;
import jwt from 'jsonwebtoken'
import { ACCESS_SECRET_KEY } from '../../../config/config.service.js'
// const secretKey = ACCESS_SECRET_KEY
const expireDate = '1h'

export const generateToken = ({ payload, secretKey, options = {} } = {}) => {
    return jwt.sign(payload, secretKey, { expiresIn: expireDate, ...options })
}

export const verifyToken = ({ token, secretKey, options = {} } = {}) => {
    try {
        return jwt.verify(token, secretKey, options)
    } catch (error) {
        return null
    }
}