interface CircularProgressProps {
  score: number
  correctCount: number
  total: number
}

export function CircularProgress({ score, correctCount, total }: CircularProgressProps) {
  return (
    <div className="relative w-48 h-48">
      <svg className="text-tertiary-container" viewBox="0 0 36 36">
        <path
          className="fill-none stroke-outline-variant"
          strokeWidth="3.8"
          d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0-31.831"
        />
        <path
          className="fill-none"
          stroke="currentColor"
          strokeWidth="3.8"
          strokeLinecap="round"
          strokeDasharray={`${score}, 100`}
          d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0-31.831"
        />
        <text
          dy=".1em"
          textAnchor="middle"
          fontSize="8"
          fontWeight="700"
          fill="currentColor"
          x="18"
          y="16"
          className="text-zh"
        >
          {score}%
        </text>
        <text
          textAnchor="middle"
          fontSize="3"
          fill="#424754"
          x="18"
          y="23"
        >
          {correctCount}/{total} corretas
        </text>
      </svg>
    </div>
  )
}