import React from 'react'

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  displayValue?: string
  customDisplayElement?: React.ReactNode
}

export default function Slider({ label, value, min, max, onChange, displayValue, customDisplayElement }: SliderProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value)
    onChange(newValue)
  }

  const percentage = ((value - min) / (max - min)) * 100
  const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i)

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <label className="text-base md:text-lg font-medium tracking-tighter">{label}</label>
        {customDisplayElement || (
          <span className="text-base md:text-lg opacity-70 tracking-tighter">{displayValue !== undefined ? displayValue : value}</span>
        )}
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={value}
          onChange={handleChange}
          className="w-full h-1 bg-transparent appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, white 0%, white ${percentage}%, rgba(255,255,255,0.1) ${percentage}%, rgba(255,255,255,0.1) 100%)`,
            WebkitAppearance: 'none',
          }}
        />
        {/* Step markers below slider */}
        <div className="flex justify-between mt-2 px-1">
          {steps.map((step) => (
            <div
              key={step}
              className={`w-1 h-1 rounded-full transition-opacity ${
                step <= value ? 'bg-white opacity-100' : 'bg-white/30 opacity-50'
              }`}
            />
          ))}
        </div>
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
