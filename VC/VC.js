const MongoClient = require("mongodb").MongoClient;
const AWS = require('aws-sdk');
const URI = process.env['VC_MONGO_URI'];
let cachedDb = null;
async function connectToDatabase() {
    if (cachedDb) {
        console.log('Using cached db');
        return cachedDb;
    }
    try {
        console.log('No cached db, connecting with mongodb client...');
        const client = await MongoClient.connect(URI).catch(err => { throw err });
        let db = client.db("vc");
        console.log('Successfully connected to vc db!');
        cachedDb = db;
        return db;
    } catch (err) {
        console.error(err);
    }
}

async function getLastCollection() {
    let db = await connectToDatabase();
    return await db.collection("last");
}

async function connectClient(api, connectionId) {
    console.log(`Insert: ${connectionId}`);
    let last = await getLastCollection();
    await last.insertOne({ connectionId: connectionId }).catch(err => console.error(err));
    return { statusCode: 200 };
}

async function disconnectClient(api, connectionId) {
    console.log(`Remove: ${connectionId}`);
    let last = await getLastCollection();
    await last.deleteOne({ connectionId: connectionId }).catch(err => console.error(err));
    return { statusCode: 200 };
}

async function postNewMessage(api, requesterConnectionId, body) {
    console.log(body);
    body = JSON.parse(body);
    let connections = await getAllConnections(requesterConnectionId);
    let data = JSON.stringify({ newMessage: { username: body.username, connectionId: requesterConnectionId, content: body.content } })
    return await sendMessagesToAllConnections(api, connections, data);
}

async function postNewQuote(api, requesterConnectionId, body) {
    body = JSON.parse(body);
    let connections = await getAllConnections(requesterConnectionId);
    let data = JSON.stringify({ quotedMessage: { username: body.username, connectionId: requesterConnectionId, content: body.content, quotedMessage: body.quotedMessage } })
    return await sendMessagesToAllConnections(api, connections, data);
}

async function sendMessagesToAllConnections(api, connections, data) {
    const sendMessages = connections.map(async(connection) => {
        try {
            await api.postToConnection({ ConnectionId: connection.connectionId, Data: data }).promise();
        } catch (e) {
            console.log(e);
        }
    });
    try {
        await Promise.all(sendMessages);
    } catch (e) {
        console.log(e);
        return { statusCode: 500 };
    }
    return { statusCode: 200 };
}

async function getAllConnections(requesterConnectionId) {
    let last = await getLastCollection();
    let connections = [];
    let cursor = await last.find();
    while (await cursor.hasNext()) {
        let next = await cursor.next();
        connections.push(next);
    }
    connections = connections.filter(connection => connection.connectionId !== requesterConnectionId);
    return connections;
}

async function getOwnConnectionId(api, connectionId) {
    try {
        await api.postToConnection({ ConnectionId: connectionId, Data: JSON.stringify({ ownConnectionId: connectionId }) }).promise();
    } catch (e) {
        console.log(e);
    }
    return { statusCode: 200 };
}

async function getConnectedUsers(api, requesterConnectionId) {
    let connections = await getAllConnections(requesterConnectionId);
    connections = connections.map(entry => entry.connectionId);
    try {
        await api.postToConnection({ ConnectionId: requesterConnectionId, Data: JSON.stringify({ connectedIds: connections }) }).promise();
    } catch (e) {
        console.error(e);
    }
    return { statusCode: 200 };
}

exports.VC = async(event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    const reqCon = event.requestContext;
    const routeKey = reqCon.routeKey;
    const api = new AWS.ApiGatewayManagementApi({
        apiVersion: '2018-11-29',
        endpoint: `${reqCon.domainName}/${reqCon.stage}`
    });

    console.log(`Switching: ${routeKey}`);
    switch (routeKey) {
        case "$connect":
            return await connectClient(api, reqCon.connectionId);
        case "$disconnect":
            return await disconnectClient(api, reqCon.connectionId);
        case "getConnectedUsers":
            return await getConnectedUsers(api, reqCon.connectionId);
        case "getOwnId":
            return await getOwnConnectionId(api, reqCon.connectionId);
        case "postNew":
            return await postNewMessage(api, reqCon.connectionId, event.body);
        case "postNewQuote":
            return await postNewQuote(api, reqCon.connectionId, event.body);

        default:
            return { statusCode: 400 };
    }

};