interface StageDays {
  research: number
  designConcept: number
  wireframes: number
  highFidelity: number
  dev: number
  qa: number
}

interface StagesTableProps {
  stageDays: StageDays
  originalDays: StageDays
  likeThat: boolean
  uploadContent: boolean
}

export default function StagesTable({ stageDays, originalDays, likeThat, uploadContent }: StagesTableProps) {
  const stages = [
    { 
      name: 'Research', 
      originalDays: originalDays.research,
      days: stageDays.research, 
      reduced: likeThat 
    },
    { 
      name: 'Wireframes', 
      originalDays: originalDays.wireframes,
      days: stageDays.wireframes, 
      reduced: uploadContent 
    },
    { 
      name: 'Design Concept', 
      originalDays: originalDays.designConcept,
      days: stageDays.designConcept, 
      reduced: false 
    },
    { 
      name: 'High-fidelity', 
      originalDays: originalDays.highFidelity,
      days: stageDays.highFidelity, 
      reduced: false 
    },
    { 
      name: 'Dev', 
      originalDays: originalDays.dev,
      days: stageDays.dev, 
      reduced: false 
    },
    { 
      name: 'QA', 
      originalDays: originalDays.qa,
      days: stageDays.qa, 
      reduced: false 
    },
  ]

  return (
    <div className="border border-white/10 rounded-lg overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left py-3 md:py-4 px-4 md:px-6 text-sm md:text-base font-medium tracking-tighter">Stage</th>
            <th className="text-right py-3 md:py-4 px-4 md:px-6 text-sm md:text-base font-medium tracking-tighter">Days</th>
          </tr>
        </thead>
        <tbody>
          {stages.map((stage) => (
            <tr
              key={stage.name}
              className="border-b border-white/10 last:border-b-0"
            >
              <td className="py-3 md:py-4 px-4 md:px-6 text-sm md:text-base tracking-tighter">
                {stage.name}
              </td>
              <td className="py-3 md:py-4 px-4 md:px-6 text-sm md:text-base text-right tracking-tighter">
                {stage.reduced ? (
                  <span>
                    <span className="line-through opacity-50 text-white/50">{stage.originalDays}</span>
                    <span className="ml-2">{stage.days}</span>
                  </span>
                ) : (
                  stage.days
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
