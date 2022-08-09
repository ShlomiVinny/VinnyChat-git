import './VCSlider.css';
export default function VCSlider(props) {
    return (
        <div className='vc-slider-container margin-top'>
            <label className="vc-slider-label" >
                {props.label}
            </label>
            <input
                id={props.id}
                className={`vc-slider-toggle vc-slider-toggle${props.value}`}
                type="range"
                min="0"
                max="1"
                onChange={event => { props.onChange(event) }}
                onClick={event => { props.onClick(event) }}
                value={props.value}
            />
        </div>
    )
}