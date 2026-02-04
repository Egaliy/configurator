interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}

export default function Slider({ label, value, min, max, onChange }: SliderProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value)
    onChange(newValue)
  }

  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <label className="text-lg font-medium tracking-tighter">{label}</label>
        <span className="text-lg opacity-70 tracking-tighter">{value}</span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={value}
          onChange={handleChange}
          className="w-full h-2 bg-transparent appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, white 0%, white ${percentage}%, rgba(255,255,255,0.1) ${percentage}%, rgba(255,255,255,0.1) 100%)`,
            WebkitAppearance: 'none',
          }}
        />
        <style>{`
          input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            width: 16px;
            height: 16px;
            background: white;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.15s;
          }
          input[type="range"]::-webkit-slider-thumb:hover {
            transform: scale(1.1);
          }
          input[type="range"]::-moz-range-thumb {
            width: 16px;
            height: 16px;
            background: white;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.15s;
          }
          input[type="range"]::-moz-range-thumb:hover {
            transform: scale(1.1);
          }
        `}</style>
      </div>
    </div>
  )
}
