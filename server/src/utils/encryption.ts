import crypto from 'crypto';

// Encryption settings
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16;  // 128 bits
const TAG_LENGTH = 16; // 128 bits

// Get encryption key from environment or generate a default one
const getEncryptionKey = (): Buffer => {
    const envKey = process.env.ENCRYPTION_KEY;

    if (envKey) {
        // If key is provided in env, pad or truncate to correct length
        const key = Buffer.from(envKey, 'utf8');
        if (key.length < KEY_LENGTH) {
            // Pad with zeros if too short
            return Buffer.concat([key, Buffer.alloc(KEY_LENGTH - key.length)]);
        } else if (key.length > KEY_LENGTH) {
            // Truncate if too long
            return key.slice(0, KEY_LENGTH);
        }
        return key;
    }

    // Fallback key for development (NOT secure for production)
    const fallbackKey = 'viral-prompt-secret-key-dev-only';
    console.warn('⚠️ Using fallback encryption key. Set ENCRYPTION_KEY in production!');
    return crypto.scryptSync(fallbackKey, 'salt', KEY_LENGTH);
};

/**
 * Encrypt a string and return base64 encoded result
 * Format: iv:tag:encrypted_data (all base64 encoded)
 */
export const encryptText = (plaintext: string): string => {
    try {
        const key = getEncryptionKey();
        const iv = crypto.randomBytes(IV_LENGTH);

        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

        let encrypted = cipher.update(plaintext, 'utf8', 'base64');
        encrypted += cipher.final('base64');

        const tag = cipher.getAuthTag();

        // Combine iv, tag, and encrypted data
        const combined = `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted}`;

        return combined;
    } catch (error) {
        console.error('❌ Encryption failed:', error);
        throw new Error('Failed to encrypt text');
    }
};

/**
 * Decrypt a base64 encoded encrypted string
 * Expected format: iv:tag:encrypted_data (all base64 encoded)
 */
export const decryptText = (encryptedData: string): string => {
    try {
        const key = getEncryptionKey();

        // Split the combined data
        const parts = encryptedData.split(':');
        if (parts.length !== 3) {
            throw new Error('Invalid encrypted data format');
        }

        const [ivBase64, tagBase64, encryptedBase64] = parts;

        const iv = Buffer.from(ivBase64, 'base64');
        const tag = Buffer.from(tagBase64, 'base64');

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(tag);

        let decrypted = decipher.update(encryptedBase64, 'base64', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error('❌ Decryption failed:', error);
        throw new Error('Failed to decrypt text');
    }
};

/**
 * Test encryption/decryption functionality
 */
export const testEncryption = (): boolean => {
    try {
        const testText = 'This is a test prompt for AI encryption';

        const encrypted = encryptText(testText);
        const decrypted = decryptText(encrypted);

        const isWorking = testText === decrypted;

        if (isWorking) {
            console.log('✅ Encryption/Decryption test passed');
        } else {
            console.error('❌ Encryption/Decryption test failed');
        }

        return isWorking;
    } catch (error) {
        console.error('❌ Encryption test error:', error);
        return false;
    }
};

/**
 * Hash a string (for indexing/searching without decryption)
 */
export const hashText = (text: string): string => {
    return crypto.createHash('sha256').update(text).digest('hex');
};