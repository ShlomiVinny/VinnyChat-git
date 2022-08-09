import { useLocation, useNavigate } from 'react-router-dom';
import './Login.css';
import outputs from '../../outputs.json';
import LoadingScreen from '../LoadingScreen/LoadingScreen';
import { useState } from 'react';
export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const codeQuery = query.get('code');
    const localvcUser = JSON.parse(localStorage.getItem('vc-user'));
    const [vcUser, setvcUser] = useState(undefined);
    const origin = window.location.origin;
    const height = window.innerHeight.toString().concat('px');

    const ws = new WebSocket(outputs.VCAPI_endpoint.value);
    ws.onopen = () => {
        console.log('Connected!');
        authChecks();
    };
    ws.onmessage = message => {
        let data = JSON.parse(message.data);
        if (data.vcUser) {
            console.log(`Verified! Saving user to local storage!`);
            localStorage.setItem('vc-user', JSON.stringify(data.vcUser));
            setvcUser(data.vcUser);
            navigate('/home', true);
        } else if (data.error) {
            console.error(data.error);
            redirectToCognitoLogin();
        }
    };

    function authChecks() {
        const now = Math.round(new Date().getTime() / 1000);
        if (codeQuery) {
            console.log("Verifying URL param code, code: ", codeQuery);
            verifyAuthCode(codeQuery);
        } else if (localvcUser) {
            const isExpired = localvcUser.expirationDate <= now;
            console.log(localvcUser.expirationDate, now, isExpired);
            if (isExpired) {
                if (localStorage.getItem('vc-settings-rememberMe') === "1" ? true : false) {
                    console.log("Navigating to '/home', user wants to be remembered, silently refreshing token...");
                    navigate('/home', true);
                }
                console.log("vcUser was found and is expired!");
                redirectToCognitoLogin();
            } else {
                console.log("local unexpired vcUser found! Navigate to /home...");
                navigate('/home', true);
            }
        } else {
            console.log("No code or no local vcUser!");
            redirectToCognitoLogin();
        }
    }

    async function verifyAuthCode(code) {
        let req = { action: "verifyAuthCode" };
        req.vcAuthCode = code;
        req.redirectUri = origin;
        // req.redirectUri = "redirect_uri=https://d36sia98mxhzpz.cloudfront.net";
        ws.send(JSON.stringify(req));
    }

    function redirectToCognitoLogin() {
        console.log('Redirecting to cognito login...');
        // redirect the user to either: signup or signin page
        const domain = `${outputs.VC_Cognito_userpool_domain_full.value}/login`;
        const client_id = `client_id=${outputs.VC_Cognito_userpool_client_id.value}`;
        const response_type = outputs.VC_Cognito_hostedui_queryParams.value.response_type_param;
        const scope = outputs.VC_Cognito_hostedui_queryParams.value.scope_param;
        const redirect_uri = `redirect_uri=${origin}`;
        const fullUrl = `${domain}?${client_id}&${response_type}&${scope}&${redirect_uri}`; // NO TRAILING '/' SLASHES!!!!!!! FFS 0AUTH!
        console.log("Redirecting to: ", fullUrl);
        window.location.assign(fullUrl);
    }

    if (vcUser) return <LoadingScreen message={<div><p>Welcome back {vcUser.username}!</p><p>Redirecting...</p></div>} height={height} />
    return <LoadingScreen message={<div><p>Securely logging you in!</p><p>Please wait...</p></div>} height={height} />
}