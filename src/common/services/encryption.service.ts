import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

export interface EncryptedMessage {
    encryptedContent: string;
    salt: string;
    iv: string;
    tag: string;
}

@Injectable()
export class EncryptionService {
    private readonly algorithm = 'aes-256-gcm';
    private readonly keyLength = 32; // 256 bits
    private readonly ivLength = 12; // 96 bits for GCM
    private readonly saltLength = 16;
    private readonly tagLength = 16;

    /**
     * Generate a new encryption key
     */
    generateKey(): string {
        return crypto.randomBytes(this.keyLength).toString('hex');
    }

    /**
     * Encrypt a message using AES-256-GCM and return components for client-side decryption
     */
    encrypt(message: string, key: string): EncryptedMessage {
        const iv = crypto.randomBytes(this.ivLength);
        const salt = crypto.randomBytes(this.saltLength);

        // Derive key using PBKDF2
        const derivedKey = crypto.pbkdf2Sync(
            Buffer.from(key, 'hex'),
            salt,
            100000, // iterations
            this.keyLength,
            'sha256'
        );

        const cipher = crypto.createCipheriv(this.algorithm, derivedKey, iv);
        const encrypted = Buffer.concat([
            cipher.update(message, 'utf8'),
            cipher.final()
        ]);

        const tag = cipher.getAuthTag();

        return {
            encryptedContent: encrypted.toString('base64'),
            salt: salt.toString('base64'),
            iv: iv.toString('base64'),
            tag: tag.toString('base64')
        };
    }

    /**
     * Decrypt a message using AES-256-GCM (for server-side operations if needed)
     */
    decrypt(encryptedMessage: EncryptedMessage, key: string): string {
        const salt = Buffer.from(encryptedMessage.salt, 'base64');
        const iv = Buffer.from(encryptedMessage.iv, 'base64');
        const tag = Buffer.from(encryptedMessage.tag, 'base64');
        const encrypted = Buffer.from(encryptedMessage.encryptedContent, 'base64');

        // Derive key using PBKDF2
        const derivedKey = crypto.pbkdf2Sync(
            Buffer.from(key, 'hex'),
            salt,
            100000, // iterations
            this.keyLength,
            'sha256'
        );

        const decipher = crypto.createDecipheriv(this.algorithm, derivedKey, iv);
        decipher.setAuthTag(tag);

        return Buffer.concat([
            decipher.update(encrypted),
            decipher.final()
        ]).toString('utf8');
    }
} 