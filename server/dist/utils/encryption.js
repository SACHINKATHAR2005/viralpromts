"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashText = exports.testEncryption = exports.decryptText = exports.encryptText = void 0;
const crypto_1 = __importDefault(require("crypto"));
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const getEncryptionKey = () => {
    const envKey = process.env.ENCRYPTION_KEY;
    if (envKey) {
        const key = Buffer.from(envKey, 'utf8');
        if (key.length < KEY_LENGTH) {
            return Buffer.concat([key, Buffer.alloc(KEY_LENGTH - key.length)]);
        }
        else if (key.length > KEY_LENGTH) {
            return key.slice(0, KEY_LENGTH);
        }
        return key;
    }
    const fallbackKey = 'viral-prompt-secret-key-dev-only';
    console.warn('⚠️ Using fallback encryption key. Set ENCRYPTION_KEY in production!');
    return crypto_1.default.scryptSync(fallbackKey, 'salt', KEY_LENGTH);
};
const encryptText = (plaintext) => {
    try {
        const key = getEncryptionKey();
        const iv = crypto_1.default.randomBytes(IV_LENGTH);
        const cipher = crypto_1.default.createCipheriv(ALGORITHM, key, iv);
        let encrypted = cipher.update(plaintext, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        const tag = cipher.getAuthTag();
        const combined = `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted}`;
        return combined;
    }
    catch (error) {
        console.error('❌ Encryption failed:', error);
        throw new Error('Failed to encrypt text');
    }
};
exports.encryptText = encryptText;
const decryptText = (encryptedData) => {
    try {
        const key = getEncryptionKey();
        const parts = encryptedData.split(':');
        if (parts.length !== 3) {
            throw new Error('Invalid encrypted data format');
        }
        const [ivBase64, tagBase64, encryptedBase64] = parts;
        const iv = Buffer.from(ivBase64, 'base64');
        const tag = Buffer.from(tagBase64, 'base64');
        const decipher = crypto_1.default.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(tag);
        let decrypted = decipher.update(encryptedBase64, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    catch (error) {
        console.error('❌ Decryption failed:', error);
        throw new Error('Failed to decrypt text');
    }
};
exports.decryptText = decryptText;
const testEncryption = () => {
    try {
        const testText = 'This is a test prompt for AI encryption';
        const encrypted = (0, exports.encryptText)(testText);
        const decrypted = (0, exports.decryptText)(encrypted);
        const isWorking = testText === decrypted;
        if (isWorking) {
            console.log('✅ Encryption/Decryption test passed');
        }
        else {
            console.error('❌ Encryption/Decryption test failed');
        }
        return isWorking;
    }
    catch (error) {
        console.error('❌ Encryption test error:', error);
        return false;
    }
};
exports.testEncryption = testEncryption;
const hashText = (text) => {
    return crypto_1.default.createHash('sha256').update(text).digest('hex');
};
exports.hashText = hashText;
//# sourceMappingURL=encryption.js.map