import { encryptMessage } from "../MessageEncHandler/MessageEncHandler";

export async function sendMessage(WebSocket, username, message) {
    const encryptedMessage = await encryptMessage(message);
    let req = { action: "postNew" };
    req.content = encryptedMessage;
    req.username = username;
    WebSocket.send(JSON.stringify(req));
    return true;
}

export async function sendQuotedMessage(WebSocket, username, messageObject) {
    const encryptedMessage = await encryptMessage(messageObject.message);
    const encryptedQuote = await encryptMessage(JSON.stringify(messageObject.quotedMessage));
    let req = { action: "postNewQuote" };
    req.content = encryptedMessage;
    req.quotedMessage = encryptedQuote;
    req.username = username;
    WebSocket.send(JSON.stringify(req));
    return true;
}