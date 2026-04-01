// 🔑 Use 32 bytes (256 bits) for AES-256
import crypto from 'crypto';
// const ENCRYPTION_KEY = crypto.randomBytes(32); // You should store this securely (e.g., env variable)
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY);

const IV_LENGTH = 16;

export function encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');

    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
}


// Decrypt function
export function decrypt(text) {

    if (!text || !text.includes(':')) {
        throw new Error("Invalid encrypted text format");
    }

    const [ivHex, encryptedText] = text.split(':');

    const iv = Buffer.from(ivHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');

    decrypted += decipher.final('utf8');

    return decrypted;
}