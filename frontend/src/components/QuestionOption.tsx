interface QuestionOptionProps {
  letter: string
  text: string
  selected: boolean
  onSelect: () => void
}

export function QuestionOption({ letter, text, selected, onSelect }: QuestionOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-2xl p-stack-md flex items-start gap-stack-md text-left transition-all duration-200 w-full relative overflow-hidden ${
        selected
          ? 'glass-card scale-[1.02]'
          : 'glass-card hover:scale-[1.02] hover:shadow-lift group'
      }`}
    >
      {selected ? <div className="absolute inset-0 bg-primary-container/10 pointer-events-none" /> : null}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 font-label-bold text-label-bold transition-colors ${
          selected
            ? 'bg-primary-container text-on-primary shadow-[0_0_12px_rgba(0,82,255,0.4)]'
            : 'bg-background text-on-surface-variant group-hover:bg-primary/10 group-hover:text-primary'
        }`}
        style={selected ? { fontVariationSettings: "'FILL' 1" } : undefined}
      >
        {selected ? (
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            check
          </span>
        ) : (
          letter
        )}
      </div>
      <div
        className={`font-body-md text-body-md pt-1 z-10 ${selected ? 'font-medium' : 'text-on-surface'}`}
      >
        {text}
      </div>
    </button>
  )
}