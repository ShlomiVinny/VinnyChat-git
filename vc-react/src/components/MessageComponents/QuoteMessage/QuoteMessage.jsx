import { useState, useEffect } from "react";
import './QuoteMessage.css';
export default function QuoteMessage(props) {

    const [quotedMessage, setQuotedMessage] = useState(undefined);

    useEffect(() => {
        setQuotedMessage(props.quotedMessage);
        console.log(props.quotedMessage);
    }, [props.quotedMessage]);

    function hideQuote(event) {
        event.preventDefault();
        event.stopPropagation();
        const close = new CustomEvent('QuoteMessageClose', { bubbles: true, cancelable: false });
        window.dispatchEvent(close);
    }

    if (quotedMessage) {
        return (
            <div className="vc-main-input-quote">
                <div className='vc-message vc-message-quote'>
                    <div className='vc-sender quote'>
                        {quotedMessage.username}
                    </div>
                    <div className='vc-content quote'>
                        {quotedMessage.content}
                    </div>
                </div>
                <button className="vc-btn hide-quote" onClick={event => hideQuote(event)}>❌</button>
            </div>
        )
    }
}
