import './Message.css';
export default function Message(props) {
    let message = props.message;
    let i = props.index;
    switch (message.poster) {
        case 'self':
            return (
                <div className='vc-message self'
                    id={i}
                    onContextMenu={event => { showQuoteMessage(event, message) }}
                >
                    <div className='vc-sender self'>
                        {message.username}
                    </div>
                    <div className='vc-content'>
                        {message.content}
                    </div>
                </div>
            )
        case 'self-quote':
            return (
                <div className='vc-message self'
                    id={i}
                    onContextMenu={event => { showQuoteMessage(event, message) }}
                >
                    <div className='vc-message quote'>
                        <div className='vc-sender quote'>
                            {message.username}
                        </div>
                        <div className='vc-content quote'>
                            {message.quotedMessage.content}
                        </div>
                    </div>
                    <div className='vc-sender self'>
                        {message.username}
                    </div>
                    <div className='vc-content self'>
                        {message.content}
                    </div>
                </div>
            )
        case 'notself':
            return (
                <div className='vc-message'
                    id={i}
                    onContextMenu={event => { showQuoteMessage(event, message) }}
                >
                    <div className='vc-sender'>
                        {message.username}
                    </div>
                    <div className='vc-content'>
                        {message.content}
                    </div>
                </div>
            )
        case "notself-quote":
            return (
                <div className='vc-message'
                    id={i}
                    onContextMenu={event => { showQuoteMessage(event, message) }}
                >
                    <div className='vc-message quote'>
                        <div className='vc-sender quote'>
                            {message.username}
                        </div>
                        <div className='vc-content quote'>
                            {message.quotedMessage.content}
                        </div>
                    </div>
                    <div className='vc-sender'>
                        {message.username}
                    </div>
                    <div className='vc-content'>
                        {message.content}
                    </div>
                </div>
            )
        default:
            return null;
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

    function showQuoteMessage(event, message) {
        handleEventCalls(event);
        if (message.quotedMessage) {
            console.log('quoted 1');
            console.log(message);
            if (message.quotedMessage.quotedMessage) {
                console.log('quoted 2');
                console.log(message);
            }
        }
        window.dispatchEvent(new CustomEvent('QuoteMessage', { detail: [message.username, message.content] }));
    }
}