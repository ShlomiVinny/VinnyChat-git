import fetch, { Headers, Request } from '/opt/nodejs/node_modules/node-fetch/src/index.js';
import AWS from '/opt/nodejs/node_modules/aws-sdk/lib/aws.js';
import { MongoClient } from "/opt/nodejs/node_modules/mongodb/lib/index.js";
import { readFileSync } from 'fs';
const outputs = JSON.parse(readFileSync('./outputs.json'));

const URI = process.env['VC_MONGO_URI'];
let cachedDb = null;
async function connectToDatabase(dbName) {
    if (cachedDb && cachedDb.name === dbName) {
        return cachedDb.db;
    }
    const client = await MongoClient.connect(URI);
    let db = await client.db(dbName);
    cachedDb = {};
    cachedDb.name = dbName;
    cachedDb.db = db;
    return db;
}

async function verifyAuthCode(api, requesterConnectionId, body) {
    try {
        if (body) {
            const bodyJSON = JSON.parse(body);
            const VC_auth_code = bodyJSON.vcAuthCode;
            const VC_redirect_uri = bodyJSON.redirectUri;
            const dbName = "vc-users";
            const collectionName = "Users";
            const db = await connectToDatabase(dbName).catch(e => { throw e });
            const collection = await db.collection(collectionName);
            console.log(`VC DAL:: Successfully connected to ${dbName}.${collectionName}!`);
            console.log(`VC DAL:: Exchange ${VC_auth_code} for tokens!`);
            let res = await handleCodeToTokensExchange(VC_auth_code, VC_redirect_uri);
            if (res.tokens) {
                console.log("VC DAL:: Tokens recieved! Creating user object...");
                const user = await createUserFromIdToken(res.tokens.id_token);
                await collection.insertOne({ vcUser: user, tokens: res.tokens, lastConnectionId: requesterConnectionId });
                console.log(`VC DAL:: vcUser and their tokens have been successfully inserted into ${dbName}.${collectionName}!`);
                await postNewResponse(api, requesterConnectionId, { vcUser: user });
            } else if (res.error) {
                console.log(`VC DAL:: ERROR:: No Tokens! `, res.error);
                await postNewResponse(api, requesterConnectionId, { error: res.error });
            }

            // const db = await connectToDatabase(dbName).catch(e => { throw e });
            // const collection = await db.collection(collectionName);
            // console.log(`VC DAL:: Successfully connected to ${dbName}.${collectionName}!`);
            // // check if the code belongs to a user in mongodb/vc-users/Users collection
            // let userData = await collection.findOne({ vcAuthCode: VC_auth_code }).catch(e => { throw e });
            // if (userData) {
            //     console.log('VC DAL:: User found! Checking expiration date...');
            //     console.log("userData: ", userData);
            //     const now = new Date().getTime();
            //     const expirationDate = userData.tokens.expirationDate;
            //     if (expirationDate > now) {
            //         console.log('VC DAL:: Expiration date looks good, post verified...');
            //         await postNewResponse(api, requesterConnectionId, {
            //             vcAuthCode: VC_auth_code,
            //             isVerified: true,
            //             isExpired: false
            //         });
            //     } else if (expirationDate <= now) {
            //         console.log('VC DAL:: Token has EXPIRED! Removing and Updating the client to relog...');
            //         // remove old auth code from db
            //         await collection.deleteOne({ vcAuthCode: VC_auth_code }).catch(e => { throw e });
            //         console.log('VC DAL:: Removed expired Token from db!');
            //         await postNewResponse(api, requesterConnectionId, {
            //             vcAuthCode: VC_auth_code,
            //             isVerified: true,
            //             isExpired: true
            //         });
            //     }
            // } else if (userData === null) {
            //     console.log('VC DAL:: User not found! Verifying auth code...');

            // }
        }
    } catch (e) {
        console.error(e);
    }
}

async function postNewResponse(api, connectionId, object) {
    console.log('VC DAL:: Posting new response...');
    try {
        await api.postToConnection({
            ConnectionId: connectionId,
            Data: JSON.stringify(object)
        }).promise().catch(e => { throw e });
    } catch (e) { console.error(e); return e; }
}

// async function refreshTokens(auth_code, refresh_token) {
//     console.log(`VC DAL:: Refresh tokens: ${refresh_token}`);
//     // call https://COGNITO_DOMAIN.auth.us-east-1.amazoncognito.com/oauth2/token
//     const OAuthURL = `${outputs.VC_Cognito_userpool_domain_full.value}/oauth2/token?`;
//     const client_id = outputs.VC_Cognito_userpool_client_id.value;
//     const secret = outputs.VC_Cognito_userpool_client_secret.value;
//     const encodedShit = Buffer.from(`${client_id}:${secret}`).toString('base64');
//     const uri = redirect_uri.endsWith('/') ? redirect_uri.substring(0, redirect_uri.length - 1) : redirect_uri;
//     const headers = new Headers();
//     headers.set('Content-Type', 'application/x-www-form-urlencoded');
//     headers.set('Authorization', `Basic ${encodedShit}`); // add base64encoded shit here
//     const params = new URLSearchParams();
//     params.set('grant_type', 'authorization_code');
//     params.set('client_id', client_id); // add shit here
//     params.set('code', auth_code); // add shit here
//     params.set('redirect_uri', uri); // NO TRAILING '/' !!! :D dipshits
//     console.log(`VC DAL:: Calling exchange endpoint with:\n${OAuthURL.concat(params)}`);
//     const request = new Request(OAuthURL.concat(params), {
//         method: 'POST',
//         headers: headers,
//         mode: 'cors'
//     });
//     // i will put this token on mongoDB eventually, right now im not keeping tokens, just making sure it works first
//     let res = await fetch(request);
//     let json = await res.json();
//     const goodres = /(\b2\d\d\b)/g;
//     const badres = /(\b4\d\d\b)/g;
//     const badserverres = /(\b5\d\d\b)/g;
//     if (res.status.toString().match(goodres)) {
//         return { statusCode: res.status, tokens: json };
//     } else if (res.status.toString().match(badres) || res.status.toString().match(badserverres)) {
//         return { statusCode: res.status, error: json };
//     }
// }

async function handleCodeToTokensExchange(auth_code, redirect_uri) {
    console.log(`VC DAL:: Exchanging token for auth_code: ${auth_code} with uri: ${redirect_uri}`);
    // call https://COGNITO_DOMAIN.auth.us-east-1.amazoncognito.com/oauth2/token
    const OAuthURL = `${outputs.VC_Cognito_userpool_domain_full.value}/oauth2/token?`;
    const client_id = outputs.VC_Cognito_userpool_client_id.value;
    const secret = outputs.VC_Cognito_userpool_client_secret.value;
    const encodedShit = Buffer.from(`${client_id}:${secret}`).toString('base64');
    const uri = redirect_uri.endsWith('/') ? redirect_uri.substring(0, redirect_uri.length - 1) : redirect_uri;
    const headers = new Headers();
    headers.set('Content-Type', 'application/x-www-form-urlencoded');
    headers.set('Authorization', `Basic ${encodedShit}`);
    const params = new URLSearchParams();
    params.set('grant_type', 'authorization_code');
    params.set('client_id', client_id);
    params.set('code', auth_code);
    params.set('redirect_uri', uri);
    console.log(`VC DAL:: Calling exchange endpoint with:\n${OAuthURL.concat(params)}`);
    const request = new Request(OAuthURL.concat(params), {
        method: 'POST',
        headers: headers,
        mode: 'cors'
    });
    let res = await fetch(request);
    let json = await res.json();
    const goodres = /(\b2\d\d\b)/g;
    const badres = /(\b4\d\d\b)/g;
    const badserverres = /(\b5\d\d\b)/g;
    if (res.status.toString().match(goodres)) {
        return { tokens: json };
    } else if (res.status.toString().match(badres) || res.status.toString().match(badserverres)) {
        return { error: json };
    }
}

async function handleTokensStorage(tokens) {

    return true;
}

async function createUserFromIdToken(idToken) {
    let user = {};
    let tokenParts = idToken.split('.', 2);
    let tokenjson = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    user.username = tokenjson["cognito:username"];
    user.audience = tokenjson.aud;
    user.expirationDate = tokenjson.exp;
    user.issuedAt = tokenjson.iat;
    user.issuer = tokenjson.iss;
    console.log(`VC DAL:: User created! Username: ${user.username}`);
    return user;
}

async function authenticateUser(api, requesterConnectionId, body) {
    try {
        const bodyJSON = JSON.parse(body);
        const vcUser = bodyJSON.vcUser;
        const dbName = "vc-users";
        const collectionName = "Users";
        console.log('VC DAL:: Authenticate user: ', vcUser);
        const db = await connectToDatabase(dbName).catch(e => { throw e });
        const collection = await db.collection(collectionName);
        console.log(`VC DAL:: Successfully connected to ${dbName}.${collectionName}!`);
        let userData = await collection.findOne({ vcUser: vcUser }).catch(e => { throw e });
        if (userData) {
            console.log('VC DAL:: vcUser found! Checking expiration date...');
            const now = Math.round(new Date().getTime() / 1000);
            const expirationDate = userData.vcUser.expirationDate;
            console.log(userData.vcUser.expirationDate, now);
            if (expirationDate > now) {
                console.log('VC DAL:: Token expiration date looks good! Authenticated!');
                await postNewResponse(api, requesterConnectionId, { isAuthenticated: true });
            } else if (expirationDate <= now) {
                console.log('VC DAL:: Token has EXPIRED! Deleting tokens and Updating the client to relog...');
                // remove old user tokens from db
                await collection.updateOne({ "vcUser.username": vcUser.username }, { $set: { tokens: {} } }).catch(e => { throw e });
                console.log('VC DAL:: Updated expired Token!');
                await postNewResponse(api, requesterConnectionId, { isAuthenticated: false });
            }
        } else {
            console.log('VC DAL:: vcUser not found! Unauthenticated!');
            await postNewResponse(api, requesterConnectionId, { isAuthenticated: false });
        }
    } catch (e) {
        console.error(e);
    }
}

export async function VCDAL(event, context) {
    context.callbackWaitsForEmptyEventLoop = false;
    const reqCon = event.requestContext;
    const routeKey = reqCon.routeKey;
    const api = new AWS.ApiGatewayManagementApi({
        apiVersion: '2018-11-29',
        endpoint: `${reqCon.domainName}/${reqCon.stage}`
    });

    console.log(`VC DAL:: Switching: ${routeKey}`);
    switch (routeKey) {
        case 'verifyAuthCode':
            await verifyAuthCode(api, reqCon.connectionId, event.body);
            return { statusCode: 200 };
        case 'getStoredMessages':
            return { statusCode: 200 };
        case 'authenticateUser':
            await authenticateUser(api, reqCon.connectionId, event.body);
            return { statusCode: 200 };
        default:
            return { statusCode: 403 };
    }
};