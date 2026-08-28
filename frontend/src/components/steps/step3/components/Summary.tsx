interface Props {
  total: number
  matched: number
  needReview: number
}

/** Live tally at the top of the step — updates as the user edits mappings. */
export function Summary({ total, matched, needReview }: Props) {
  return (
    <div className="flex gap-4 text-sm">
      <span className="text-gray-500">{total} exercises</span>
      <span className="text-green-700">{matched} matched</span>
      {needReview > 0 && <span className="text-amber-600">{needReview} need review</span>}
    </div>
  )
}
