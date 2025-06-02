export interface EncryptedMessage {
    encryptedContent: string;
    salt: string;
    iv: string;
    tag: string;
}

export interface EncryptedChatMessage {
    id: string;
    sender_wallet_address: string;
    receiver_wallet_address: string;
    content: string;
    is_read: boolean;
    encryption_key: string;
    is_encrypted: boolean;
    encryption_salt: string;
    encryption_iv: string;
    encryption_tag: string;
    created_at: Date;
}

export interface EncryptedCommunityChatMessage {
    id: string;
    community_chat_id: string;
    sender_wallet_address: string;
    content: string;
    encryption_key: string;
    is_encrypted: boolean;
    encryption_salt: string;
    encryption_iv: string;
    encryption_tag: string;
    created_at: Date;
} 