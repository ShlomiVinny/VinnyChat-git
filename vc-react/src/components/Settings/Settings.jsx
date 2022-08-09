import { useEffect } from 'react';
import { useState } from 'react';
import './Settings.css';
import outputs from '../../outputs.json';
import VCSlider from '../UIcomponents/VCSlider/VCSlider';
export default function Settings(props) {

    const [settingsClasses, setSettingsClasses] = useState(props.visibility);
    const [storeMessages, setStoreMessages] = useState(localStorage.getItem('vc-settings-storeMessages') === "1" ? "1" : "0");
    const [rememberMe, setRememberMe] = useState(localStorage.getItem('vc-settings-rememberMe') === "1" ? "1" : "0");
    const [allowImgSharing, setAllowImgSharing] = useState(localStorage.getItem('vc-settings-allowImgSharing') === "1" ? "1" : "0");

    useEffect(() => {
        setSettingsClasses(props.visibility);
    }, [props.visibility]);

    window.addEventListener('CloseAllMenues', () => {
        setSettingsClasses("hidden");
    });

    function handleEventCalls(event) {
        if ("preventDefault" in event) {
            event.preventDefault();
        }
        if ("stopPropagation" in event) {
            event.stopPropagation();
        }
        if ("stopImmediatePropagation" in event) {
            event.stopImmediatePropagation();
        }
    }

    function handleSliderChange(event) {
        handleEventCalls(event);
        const value = event.target.value;
        const id = event.target.id;
        switch (id) {
            case "storeMessages":
                if (value !== storeMessages) {
                    setStoreMessages(value);
                    localStorage.setItem('vc-settings-storeMessages', value);
                }
                break;
            case "rememberMe":
                if (value !== rememberMe) {
                    setRememberMe(value);
                    localStorage.setItem('vc-settings-rememberMe', value);
                }
                break;
            case "allowImgSharing":
                if (value !== allowImgSharing) {
                    setAllowImgSharing(value);
                    localStorage.setItem('vc-settings-allowImgSharing', value);
                }
                break;
            default:
                break;
        }
    }

    function handleSliderClick(event) {
        handleEventCalls(event);
        const value = event.target.value;
        const id = event.target.id;
        switch (id) {
            case "storeMessages":
                if (value === "1") {
                    setStoreMessages("0");
                    localStorage.setItem('vc-settings-storeMessages', "0");
                } else {
                    setStoreMessages("1");
                    localStorage.setItem('vc-settings-storeMessages', "1");
                }
                break;
            case "rememberMe":
                if (value === "1") {
                    setRememberMe("0");
                    localStorage.setItem('vc-settings-rememberMe', "0");
                    updateUserSettingsOnBackend("rememberMe", "0");
                } else {
                    setRememberMe("1");
                    localStorage.setItem('vc-settings-rememberMe', "1");
                    updateUserSettingsOnBackend("rememberMe", "1");
                }
                break;
            case "allowImgSharing":
                if (value === "1") {
                    setAllowImgSharing("0");
                    localStorage.setItem('vc-settings-allowImgSharing', "0");
                } else {
                    setAllowImgSharing("1");
                    localStorage.setItem('vc-settings-allowImgSharing', "1");
                }
                break;
            default:
                break;
        }
    }

    function updateUserSettingsOnBackend(settingName, value) {
        const ws = new WebSocket(outputs.VCAPI_endpoint.value);
        let req = { action: "updateUserSettings" };
        const localAuthCode = localStorage.getItem('vc-local-code');
        req.vcAuthCode = localAuthCode;
        req[settingName] = value;
        ws.send(JSON.stringify(req));
    }

    return (
        <div className={`vc-navbar-menu ${settingsClasses}`} onClick={event => handleEventCalls(event)}>
            <div className="menu-header"> Settings </div>
            <div className='menu-seperator'></div>
            <VCSlider label="Store Messages" id="storeMessages" value={storeMessages} onChange={handleSliderChange} onClick={handleSliderClick} />
            <VCSlider label="Remember Me For Longer (NOT recommended)" id="rememberMe" value={rememberMe} onChange={handleSliderChange} onClick={handleSliderClick} />
            <VCSlider label="Allow Image Sharing (Requires additional permissions)" id="allowImgSharing" value={allowImgSharing} onChange={handleSliderChange} onClick={handleSliderClick} />
        </div>
    )
}