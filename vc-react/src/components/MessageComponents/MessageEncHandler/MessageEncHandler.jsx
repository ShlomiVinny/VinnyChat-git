import { Buffer } from 'buffer';
export async function encryptMessage(message) {
    const cryptoKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const B64iv = Buffer.from(iv).toString('base64');
    const encodedMessage = new TextEncoder('utf-8').encode(message);
    const encryptedMessage = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, cryptoKey, encodedMessage);
    const B64Encrypted = Buffer.from(encryptedMessage).toString('base64');
    const key = await crypto.subtle.exportKey('jwk', cryptoKey);
    const payload = `${key.k}:${B64Encrypted}:${B64iv}`;
    // const hash = await digestMessage(payload);
    // console.log(Buffer.from(hash).toString());
    return padPayload(payload);
}

export async function decryptMessage(message) {
    const payload = unpadPayload(message);
    const data = payload.split(':').map(entry => { return Buffer.from(entry).toString() });
    const key = data[0];
    const cryptoKey = await crypto.subtle.importKey('jwk', { k: key, kty: "oct" }, "AES-GCM", true, ["encrypt", "decrypt"]);
    const encodedEncrypted = Buffer.from(data[1], 'base64');
    const iv = Buffer.from(data[2], 'base64').buffer;
    const encodedDecrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, cryptoKey, encodedEncrypted).catch(err => console.error(err));
    const decryptedMessage = Buffer.from(encodedDecrypted).toString();
    console.log('Decrypted Message: ', decryptedMessage);
    return decryptedMessage;
}

function padPayload(payload) {
    let padding = 'PaddingString';
    return Buffer.from(padding).toString('base64').concat(payload);
}

function unpadPayload(payload) {
    let padding = 'PaddingString';
    let B64padding = Buffer.from(padding).toString('base64');
    return payload.replace(B64padding, '');
}

    // async function digestMessage(message) {
    //     const encoder = new TextEncoder();
    //     const data = encoder.encode(message);
    //     const hash = await crypto.subtle.digest('SHA-512', data);
    //     return hash;
    // }

