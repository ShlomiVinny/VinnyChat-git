import { useState } from 'react';
import { Link } from 'react-router-dom';
import Settings from '../Settings/Settings';

import './Navbar.css';
export default function Navbar(props) {

    const [menuClasses, setMenuClasses] = useState("hidden");
    const [settingsVisiblility, setSettingsVisiblility] = useState("hidden");

    window.addEventListener('CloseAllMenues', () => {
        setSettingsVisiblility("hidden");
        setMenuClasses("hidden");
    });

    function handleMenuClick(event) {
        handleEventCalls(event);
        if (menuClasses === "visible") {
            setMenuClasses("hidden");
        } else if (menuClasses === "hidden") {
            setSettingsVisiblility("hidden");
            setMenuClasses("visible");
            getConnectedUsers();
        }
    }

    function handleSettingsClick(event) {
        handleEventCalls(event);
        if (settingsVisiblility === "visible") {
            setSettingsVisiblility("hidden");
            setMenuClasses("visible");
        } else if (settingsVisiblility === "hidden") {
            setSettingsVisiblility("visible");
            setMenuClasses("hidden");
        }
    }

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

    function getConnectedUsers() {
        if (props.socket) {
            let req = { action: "getConnectedUsers" };
            const ws = props.socket;
            ws.send(JSON.stringify(req));
        }
    }

    function drawConnectedUsers() {
        let template = props.connectedUsers.map((entry, i) => {
            if (entry === props.ownId) {
                return (
                    <p className='vc-connected-user' key={i}>{entry} (You)</p>
                )
            }
            return (
                <p className='vc-connected-user' key={i}>{entry}</p>
            )
        })
        return template;
    }

    function logout(event) {
        handleEventCalls(event);
        localStorage.removeItem('vc-user');
        const logoutEvent = new CustomEvent('VCLogoutEvent', { bubbles: true, cancelable: false });
        window.dispatchEvent(logoutEvent);
    }

    return (
        <div className='navbar-container'>
            <div className="navbar-wrapper">
                <img className='logo' src="./4lc-64.png" alt='' onClick={event => { handleMenuClick(event) }}></img>
                <Link className='router-link home-link' to={"/"}>Vinny Chat</Link>
                <button className='vc-btn logout-btn' onClick={event => { logout(event) }}>Logout</button>
            </div>
            <div className={`vc-navbar-menu ${menuClasses}`}>
                <div className='menu-text'>Connected Users</div>
                <div className='menu-seperator'></div>
                <div className='vc-connected-users' onClick={event => handleEventCalls(event)}>
                    {drawConnectedUsers()}
                </div>
                <div className='menu-seperator'></div>
                <div className="settings-link" onClick={event => handleSettingsClick(event)}>
                    Settings
                </div>
            </div>
            <Settings visibility={settingsVisiblility} />
            <div className='vc-backdrop'></div>
        </div>
    )
}