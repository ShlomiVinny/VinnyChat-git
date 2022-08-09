import './LoadingScreen.css';
export default function LoadingScreen({ message, callback = () => { } }) {
    const height = window.innerHeight.toString().concat('px');
    console.log(height);
    return (
        <div className="vc-loading-wrapper" style={{ height: height }} onClick={event => callback(event)}>
            <div className='vc-loading'>
                <img className='vc-loading-logo' src="./4lc-192.png" alt=''></img>
                <div className='vc-loading-msg'>
                    {message}
                </div>
            </div>
        </div>
    )
}