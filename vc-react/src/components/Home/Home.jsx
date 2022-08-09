import React from 'react';
import './Home.css';
import outputs from '../../outputs.json';
import Navbar from '../Navbar/Navbar';
import Picker from 'emoji-picker-react';
import QuoteMessage from '../MessageComponents/QuoteMessage/QuoteMessage';
import Messages from '../MessageComponents/Messages/Messages';
import { decryptMessage } from '../MessageComponents/MessageEncHandler/MessageEncHandler';
import { sendMessage, sendQuotedMessage } from '../MessageComponents/MessageTransferHandler/MessageTransferHandler';
import { Navigate } from 'react-router-dom';
import LoadingScreen from '../LoadingScreen/LoadingScreen';

export default class HomePage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            message: '',
            messages: [],
            height: window.innerHeight.toString().concat('px'),
            template: [],
            bottom: React.createRef(),
            mainInputRef: React.createRef(),
            ws: new WebSocket(outputs.VCAPI_endpoint.value),
            showInputHint: false,
            hintsDismissed: localStorage.getItem('vc-hintsDismissed') === 'true' ? localStorage.getItem('vc-hintsDismissed') : false,
            connectedUsers: [],
            ownId: '',
            showEmojiPicker: false,
            emojiPickerClasses: 'hidden',
            touchStart: 0,
            touchEnd: 0,
            quotedMessage: undefined,
            isAuthenticated: undefined,
            redirectToLoginPage: undefined,
            vcUser: undefined
        }
        this.handleMainInputChange = this.handleMainInputChange.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
        this.handleWebsocketMessages = this.handleWebsocketMessages.bind(this);
        this.getOwnConnectionId = this.getOwnConnectionId.bind(this);
        this.addEventListeners = this.addEventListeners.bind(this);
        this.showInputHint = this.showInputHint.bind(this);
        this.dismissHints = this.dismissHints.bind(this);
        this.onFocusMainInput = this.onFocusMainInput.bind(this);
        this.onBlurMainInput = this.onBlurMainInput.bind(this);
        this.hideEmojiPicker = this.hideEmojiPicker.bind(this);
        this.showEmojiPicker = this.showEmojiPicker.bind(this);
        this.scrollToBottom = this.scrollToBottom.bind(this);
        this.showQuoteMessage = this.showQuoteMessage.bind(this);
        this.hideQuoteMessage = this.hideQuoteMessage.bind(this);
        this.reconnect = this.reconnect.bind(this);
        this.authenticateUser = this.authenticateUser.bind(this);
        this.closeAllMenues = this.closeAllMenues.bind(this);
        this.redirectToLoginPage = this.redirectToLoginPage.bind(this);
    }

    componentDidMount() {
        this.addEventListeners();
    }

    componentDidUpdate() {
        if (this.state.ws.readyState === WebSocket.CLOSED || this.state.ws.readyState === WebSocket.CLOSING) {
        }
    }

    componentWillUnmount() {

    }

    authenticateUser() {
        const ws = this.state.ws;
        const localvcUser = JSON.parse(localStorage.getItem('vc-user'));
        console.log(localvcUser);
        const rememberMe = localStorage.getItem('vc-settings-rememberMe') === "1" ? true : false;
        if (rememberMe) {
            this.setState({ isAuthenticated: true });
        }
        if (localvcUser) {
            let req = { action: "authenticateUser" };
            req.vcUser = localvcUser;
            ws.send(JSON.stringify(req));
        } else {
            this.redirectToLoginPage();
        }
    }

    addEventListeners() {
        const ws = this.state.ws;
        ws.onopen = () => {
            console.log('open');
            this.authenticateUser();
        }
        ws.onclose = () => {
            this.forceUpdate();
        }
        ws.onerror = () => {
            this.forceUpdate();
        }
        ws.onmessage = message => {
            // console.log('Incoming: ', message);
            // console.log(JSON.parse(message.data));
            this.handleWebsocketMessages(message);
        }
        window.addEventListener('resize', event => {
            this.handleEventCalls(event);
            this.setState({ height: window.innerHeight.toString().concat('px') });
        });
        window.addEventListener('QuoteMessageClose', event => {
            this.handleEventCalls(event);
            this.hideQuoteMessage();
        });
        window.addEventListener('QuoteMessage', event => {
            this.handleEventCalls(event);
            this.showQuoteMessage(event);
        });
        window.addEventListener('VCLogoutEvent', event => {
            this.handleEventCalls(event);
            this.setState({ vcUser: undefined, isAuthenticated: false, });
            this.redirectToLoginPage();
        });
        window.addEventListener('keypress', event => {
            if (event.isTrusted) {
                switch (event.key) {
                    case 'Enter':
                        if (this.state.message !== '' | ' ') {
                            this.sendMessage(event);
                        }
                        break;
                    default:
                        break;
                }
            }
        });
    }

    async handleWebsocketMessages(message) {
        const data = JSON.parse(message.data);
        if (data.newMessage) {
            const newMsg = data.newMessage;
            const username = newMsg.username;
            const decryptedMessage = await decryptMessage(newMsg.content);
            let messages = this.state.messages;
            messages.push({ poster: "notself", username: username, content: decryptedMessage });
            this.setState({ messages: messages }, () => { this.scrollToBottom(); });
        } else if (data.quotedMessage) {
            const newMsg = data.newMessage;
            const username = newMsg.username;
            const decryptedMessage = await decryptMessage(newMsg.content);
            const decryptedQuote = JSON.parse(await decryptMessage(newMsg.quotedMessage));
            let messages = this.state.messages;
            messages.push({ poster: "notself-quote", username: username, content: decryptedMessage, quotedMessage: decryptedQuote });
            this.setState({ messages: messages }, () => { this.scrollToBottom(); });
        } else if (data.ownConnectionId) {
            let ownId = data.ownConnectionId;
            let users = this.state.connectedUsers;
            users.unshift(ownId);
            this.setState({ ownId: ownId, connectedUsers: users });
        } else if (data.connectedIds) {
            let ids = [this.state.ownId, ...data.connectedIds];
            this.setState({ connectedUsers: ids });
        } else if (data.isAuthenticated) {
            const vcUser = JSON.parse(localStorage.getItem('vc-user'));
            this.setState({ isAuthenticated: data.isAuthenticated, vcUser: vcUser });
            this.getOwnConnectionId();
        } else if (data.isAuthenticated === false) {
            localStorage.removeItem('vc-user');
            this.setState({ isAuthenticated: data.isAuthenticated });
        }
    }

    async sendMessage(event) {
        this.handleEventCalls(event);
        let message = this.state.message;
        let messages = this.state.messages;
        let quotedMessage = this.state.quotedMessage;
        const username = this.state.vcUser.username;
        if (quotedMessage) {
            await sendQuotedMessage(this.state.ws, username, { message: message, quotedMessage: quotedMessage, ws: this.state.ws });
            messages.push({ poster: "self-quote", username: username, content: message, quotedMessage: quotedMessage });
            this.setState({ message: '', messages: messages }, () => {
                this.hideQuoteMessage();
                if (this.state.showEmojiPicker === false) this.focusMainInput();
                this.scrollToBottom();
            });
            return;
        }
        await sendMessage(this.state.ws, username, message);
        messages.push({ poster: "self", username: username, content: message });
        this.setState({ message: '', messages: messages }, () => {
            if (this.state.showEmojiPicker === false) this.focusMainInput();
            this.scrollToBottom();
        });
    }

    scrollToBottom() {
        if (this.state.bottom.current) {
            if ("scrollIntoView" in this.state.bottom.current) {
                this.state.bottom.current.scrollIntoView({ behavior: "smooth" });
            } else {
                this.state.bottom.current.scrollIntoViewIfNeeded(false);
            }
        }
    }

    focusMainInput() {
        if (this.state.mainInputRef.current) {
            this.state.mainInputRef.current.focus();
        }
        this.scrollToBottom();
    }

    getOwnConnectionId() {
        let req = { action: "getOwnId" };
        const ws = this.state.ws;
        ws.send(JSON.stringify(req));
    }

    handleEventCalls(event) {
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

    showEmojiPicker(event) {
        this.handleEventCalls(event);
        setTimeout(() => {
            this.setState({ emojiPickerClasses: 'visible', showEmojiPicker: true }, () => {
                this.scrollToBottom();
            });
        }, 40);
    }

    hideEmojiPicker(event) {
        this.handleEventCalls(event);
        this.setState({ emojiPickerClasses: 'hidden', showEmojiPicker: false });
        this.scrollToBottom();
    }

    handleMainInputChange(event) {
        this.handleEventCalls(event);
        this.setState({ message: event.target.value });
    }

    showInputHint(event) {
        this.handleEventCalls(event);
        if (this.state.hintsDismissed === false) {
            this.setState({ showInputHint: true });
        }
    }

    dismissHints(event) {
        this.handleEventCalls(event);
        this.setState({ hintsDismissed: true, showInputHint: false });
        localStorage.setItem('vc-hintsDismissed', true);
    }

    onFocusMainInput(event) {
        this.handleEventCalls(event);
        this.showInputHint(event);
        this.hideEmojiPicker(event);
        setTimeout(() => {
            this.setState({ mainInputClasses: 'focused' }, () => {
                this.scrollToBottom();
            });
        }, 50);
    }

    onBlurMainInput(event) {
        this.handleEventCalls(event);
        this.setState({ mainInputClasses: 'unfocused' });
    }

    showQuoteMessage(event) {
        this.handleEventCalls(event);
        this.setState({ quotedMessage: { username: event.detail[0], content: event.detail[1] } }, () => {
            this.focusMainInput();
        });
    }

    hideQuoteMessage() {
        this.setState({ quotedMessage: undefined }, () => {
            this.scrollToBottom();
        });
    }

    reconnect(event) {
        this.handleEventCalls(event);
        this.setState({ ws: new WebSocket(outputs.VCAPI_endpoint.value), isAuthenticated: undefined }, () => {
            this.addEventListeners();
        });
    }

    redirectToLoginPage() {
        console.log("Redirect to login page...");
        this.setState({ redirectToLoginPage: <Navigate to={'/login'} replace={true} /> });
    }

    closeAllMenues(event) {
        this.handleEventCalls(event);
        const closeAll = new CustomEvent('CloseAllMenues', { bubbles: true, cancelable: false });
        window.dispatchEvent(closeAll);
    }

    render() {
        if (this.state.redirectToLoginPage) {
            return this.state.redirectToLoginPage;
        } else if (this.state.isAuthenticated === false) {
            return <LoadingScreen message={<div><p>Unauthenticated!</p><p>Tap the screen to log-in!</p></div>} callback={this.redirectToLoginPage} />
        } else if (this.state.ws.readyState === WebSocket.CONNECTING) {
            return <LoadingScreen message={<p> Connecting... </p>} />
        } else if (this.state.ws.readyState === WebSocket.OPEN && this.state.isAuthenticated === true) {
            return (
                <div className="Home" style={{ height: this.state.height }} onClick={event => this.closeAllMenues(event)}>
                    <Navbar
                        socket={this.state.ws}
                        connectedUsers={this.state.connectedUsers}
                        ownId={this.state.ownId}
                    />

                    <div className='vc-messages-container'>
                        <Messages messages={this.state.messages} />
                        <div ref={this.state.bottom}></div>
                    </div>

                    <div className='vc-input-hint' style={{ visibility: this.state.showInputHint === true ? 'visible' : 'hidden' }}>
                        You can press 'Enter' to send the message, press the Send Arrow on your mobile device or press the ✔!
                        <button className='vc-hideHints' onClick={event => { this.dismissHints(event) }}>Dont Show Again</button>
                    </div>

                    {this.state.quotedMessage ? <QuoteMessage quotedMessage={this.state.quotedMessage} ownConnectionId={this.state.ownId} /> : null}

                    <div className='vc-main-input-wrapper'>
                        <textarea className="vc-main-input"
                            onChange={event => { this.handleMainInputChange(event) }}
                            value={this.state.message}
                            onFocus={event => { this.onFocusMainInput(event) }}
                            onBlur={event => { this.onBlurMainInput(event) }}
                            inputMode="text"
                            ref={this.state.mainInputRef}
                        ></textarea>

                        <div className='vc-buttons-wrapper'>
                            <button className='vc-btn send'
                                disabled={this.state.message === '' | ' '}
                                onClick={event => { this.sendMessage(event) }}
                                type="submit"
                            >✔</button>
                            <div className='vc-btn-emoji'
                                onClick={event => { this.state.showEmojiPicker ? this.hideEmojiPicker(event) : this.showEmojiPicker(event) }}
                            >🙂</div>
                        </div>
                    </div>
                    <div className={`vc-emoji-picker ${this.state.emojiPickerClasses}`}>
                        <Picker
                            onEmojiClick={(event, emoji) => {
                                event.preventDefault();
                                this.setState({ message: this.state.message.concat(emoji.emoji) });
                            }}
                        />
                    </div>
                </div>
            )
        } else if (this.state.ws.readyState === WebSocket.CLOSED || this.state.ws.readyState === WebSocket.CLOSING) {
            return <LoadingScreen message={<div><p> Disconnected!</p><p>Please tap the screen to reconnect!</p></div>} callback={this.reconnect} />
        }
    }
};