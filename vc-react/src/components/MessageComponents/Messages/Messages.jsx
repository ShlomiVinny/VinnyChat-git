import Message from "../Message/Message";
import './Messages.css';
export default function Messages(props) {

    return (
        <div className='vc-messages'>
            {createTemplate()}
        </div>
    )

    function createTemplate() {
        return props.messages.map((message, i) => {
            return <Message message={message} index={i} key={i} />
        })
    }
}