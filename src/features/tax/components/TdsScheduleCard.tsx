import { formatInr } from '../../../shared/lib/format'
import type { TdsScheduleView } from '../tax.types'

interface TdsScheduleCardProps {
  schedule: TdsScheduleView
  totalTax: number
}

export function TdsScheduleCard({ schedule, totalTax }: TdsScheduleCardProps) {
  const percent =
    totalTax > 0
      ? Math.min(100, (schedule.deductedTillDate / totalTax) * 100)
      : 0

  return (
    <div className="card mt">
      <h3>TDS schedule</h3>
      <div id="tdsSchedule">
        <div className="kv">
          <b>Months elapsed</b>
          <span>
            {schedule.monthsElapsed} of {schedule.totalMonths}
          </span>
        </div>
        <div className="kv">
          <b>Deducted till last month</b>
          <span>{formatInr(schedule.deductedTillDate)}</span>
        </div>
        <div className="kv">
          <b>Remaining this FY</b>
          <span>{formatInr(Math.max(0, schedule.remainingThisFy))}</span>
        </div>

        <div className="bar mt">
          <i
            style={{
              width: `${percent}%`,
              background: 'var(--violet, #6d53f0)',
            }}
          />
        </div>

        <div className="hint mt8">{schedule.explanationNote}</div>
      </div>
    </div>
  )
}
