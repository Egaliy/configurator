interface SubmitButtonProps {
  onClick: () => void
}

export default function SubmitButton({ onClick }: SubmitButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full md:w-auto px-12 py-4 bg-white text-black rounded-lg hover:opacity-90 transition-opacity text-base text-center"
      style={{
        fontFamily: '"Almarena Neue Regular", "Almarena Neue Regular Placeholder", sans-serif',
        fontWeight: 400,
        letterSpacing: '-0.02em',
        lineHeight: '1.2em',
      }}
    >
      Leave a request
    </button>
  )
}
