import { useRef, useCallback, useState, useEffect } from 'react'
import type { Stage, TimelineEvent } from './mockData'
import { addDaysToDate } from './mockData'

interface TimelineProps {
  stages: Stage[]
  events: TimelineEvent[]
  canEdit?: boolean
  onStageChange?: (stageId: string, patch: Partial<Pick<Stage, 'startDate' | 'endDate'>>) => void
  onEventChange?: (eventId: string, patch: { date: string }) => void
  /** Открыть панель этапа по клику (не срабатывает после драга) */
  onStageOpen?: (stageId: string) => void
  /** Поменять порядок этапа в списке (вверх/вниз) */
  onStageReorder?: (stageId: string, direction: 'up' | 'down') => void
  /** Удалить этап (вызывается при отпускании в зоне «удалить» при драге вверх) */
  onStageDelete?: (stageId: string) => void
  /** Слот справа в одном ряду с заголовком (например кнопка добавления) */
  headerAction?: React.ReactNode
  /** Растянуть область таймлайна на всю доступную высоту */
  fillHeight?: boolean
  /** Проскроллить к этапу (плавно) и вызвать onScrollToStageIdDone после */
  scrollToStageId?: string | null
  onScrollToStageIdDone?: () => void
}

const BASE_PX_PER_DAY = 80
const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const
const DEFAULT_ZOOM_INDEX = 2 // 1 = неделя по умолчанию
const ROW_HEIGHT = 56
const HEADER_HEIGHT = 64
/** Чёрный градиент как на карточке конфигуратора */
const CARD_BLACK_GRADIENT = 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.88) 40%, rgba(0,0,0,0.82) 100%)'
/** Узкие градиенты по краям (даты и блоки под ними) */
const EDGE_GRADIENT_WIDTH = 40
const LEFT_EDGE_GRADIENT = `linear-gradient(to right, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)`
const RIGHT_EDGE_GRADIENT = `linear-gradient(to left, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)`
const TIMELINE_MAX_HEIGHT = 400
const BOTTOM_STRIPE_GRADIENT = 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)'
const TRANSITION_FAST = '0.15s ease-out'
const TRANSITION_NORMAL = '0.25s ease-out'

/** Заливка и «неактивность» этапа: прошедшие — серые неактивные, текущий ярче, будущие нейтрально */
function stageBlockStyle(stage: Stage, todayTime: number): { backgroundColor: string; opacity?: number } {
  const start = new Date(stage.startDate).setHours(0, 0, 0, 0)
  const end = new Date(stage.endDate).setHours(0, 0, 0, 0)
  if (todayTime >= start && todayTime <= end) return { backgroundColor: 'rgba(255,255,255,0.25)' }
  if (end < todayTime) return { backgroundColor: 'rgba(255,255,255,0.08)', opacity: 0.75 }
  return { backgroundColor: 'rgba(255,255,255,0.18)' }
}

function parseDate(s: string): Date {
  const d = new Date(s)
  d.setHours(0, 0, 0, 0)
  return d
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function formatDayLabel(d: Date): string {
  const weekday = d.toLocaleDateString('en-GB', { weekday: 'short' })
  const day = d.getDate()
  return `${weekday} ${day}`
}

function getDaysInRange(start: Date, end: Date): Date[] {
  const out: Date[] = []
  const cur = new Date(start)
  cur.setHours(0, 0, 0, 0)
  const endTime = end.getTime()
  while (cur.getTime() <= endTime) {
    out.push(new Date(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return out
}

type DragRef =
  | { kind: 'move' | 'resize'; stageId: string; startX: number; startStart: string; startEnd: string }
  | { kind: 'event'; eventId: string; startX: number; startDate: string }

const DELETE_ZONE_THRESHOLD_PX = 56

export default function Timeline({ stages, events, canEdit, onStageChange, onEventChange, onStageOpen, onStageReorder, onStageDelete, headerAction, fillHeight, scrollToStageId, onScrollToStageIdDone }: TimelineProps) {
  const dragRef = useRef<DragRef | null>(null)
  const justDraggedRef = useRef(false)
  const lastMoveClientXRef = useRef(0)
  const lastMoveOffsetPxRef = useRef(0)
  const dragContainerTopRef = useRef(0)
  const deleteZoneActiveRef = useRef(false)
  const scrollTargetLeftRef = useRef<number | null>(null)
  const scrollTargetWidthRef = useRef<number | null>(null)
  const [draggingStageId, setDraggingStageId] = useState<string | null>(null)
  const [draggingEventId, setDraggingEventId] = useState<string | null>(null)
  const [dragMoveOffsetPx, setDragMoveOffsetPx] = useState(0)
  /** После отпускания: плавное притягивание к сетке дней */
  const [postMoveSnapStageId, setPostMoveSnapStageId] = useState<string | null>(null)
  const [postMoveSnapOffsetPx, setPostMoveSnapOffsetPx] = useState(0)
  const [resizingStageId, setResizingStageId] = useState<string | null>(null)
  const [resizeInitialEnd, setResizeInitialEnd] = useState<string | null>(null)
  const [dragResizeOffsetPx, setDragResizeOffsetPx] = useState(0)
  const [deleteZoneActive, setDeleteZoneActive] = useState(false)
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX)
  const pxPerDay = BASE_PX_PER_DAY * ZOOM_LEVELS[zoomIndex]
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const horizontalScrollRef = useRef<HTMLDivElement>(null)
  const scrollLeftOpenRef = useRef(0)
  const initialScrollDoneRef = useRef(false)
  const [hasOverflowVertical, setHasOverflowVertical] = useState(false)
  const [horizontalOverflow, setHorizontalOverflow] = useState({ left: false, right: false })

  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const check = () => setHasOverflowVertical(el.scrollHeight > el.clientHeight)
    check()
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  }, [stages.length])

  useEffect(() => {
    const el = horizontalScrollRef.current
    if (!el) return
    const check = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el
      const threshold = 4
      setHorizontalOverflow({
        left: scrollLeft > threshold,
        right: scrollLeft + clientWidth < scrollWidth - threshold,
      })
    }
    check()
    el.addEventListener('scroll', check, { passive: true })
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', check)
      ro.disconnect()
    }
  }, [stages.length, events.length, zoomIndex])

  useEffect(() => {
    const el = horizontalScrollRef.current
    if (!el || initialScrollDoneRef.current) return
    const scrollLeft = scrollLeftOpenRef.current
    if (scrollLeft <= 0) return
    initialScrollDoneRef.current = true
    el.scrollLeft = scrollLeft
  }, [stages.length, events.length])

  useEffect(() => {
    if (!scrollToStageId || !onScrollToStageIdDone) return
    const el = horizontalScrollRef.current
    const left = scrollTargetLeftRef.current
    if (el == null || left == null) {
      onScrollToStageIdDone()
      return
    }
    const margin = 40
    const targetScroll = Math.max(0, Math.min(left - margin, el.scrollWidth - el.clientWidth))
    el.scrollTo({ left: targetScroll, behavior: 'smooth' })
    scrollTargetLeftRef.current = null
    scrollTargetWidthRef.current = null
    onScrollToStageIdDone()
  }, [scrollToStageId, onScrollToStageIdDone, stages.length])

  // Плавное притягивание к сетке после отпускания этапа
  useEffect(() => {
    if (!postMoveSnapStageId) return
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setPostMoveSnapOffsetPx(0))
    })
    const t = setTimeout(() => {
      setPostMoveSnapStageId(null)
      setPostMoveSnapOffsetPx(0)
    }, 280)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(t)
    }
  }, [postMoveSnapStageId])

  const pxToDays = useCallback((px: number) => Math.round(px / pxPerDay), [pxPerDay])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const d = dragRef.current
      if (!d) return
      const deltaPx = e.clientX - d.startX
      const deltaDays = pxToDays(deltaPx)
      if (d.kind === 'event') {
        if (deltaDays === 0) return
        if (!onEventChange) return
        const newDate = addDaysToDate(d.startDate, deltaDays)
        onEventChange(d.eventId, { date: newDate })
        dragRef.current = { ...d, startX: e.clientX, startDate: newDate }
      } else if (d.kind === 'move') {
        setDragMoveOffsetPx(deltaPx)
        lastMoveClientXRef.current = e.clientX
        lastMoveOffsetPxRef.current = deltaPx
        const top = dragContainerTopRef.current
        const inDeleteZone = e.clientY < top - DELETE_ZONE_THRESHOLD_PX
        deleteZoneActiveRef.current = inDeleteZone
        setDeleteZoneActive(inDeleteZone)
      } else {
        // resize: только визуальный offset, state обновим в mouseup
        lastMoveClientXRef.current = e.clientX
        setDragResizeOffsetPx(e.clientX - d.startX)
      }
    },
    [onStageChange, onEventChange, pxToDays]
  )

  const handleMouseUp = useCallback(() => {
    const d = dragRef.current
    const hadDrag = d != null
    if (hadDrag && d.kind === 'move' && deleteZoneActiveRef.current && onStageDelete) {
      onStageDelete(d.stageId)
    } else if (hadDrag && d.kind === 'move' && !deleteZoneActiveRef.current && onStageChange) {
      const totalDeltaPx = lastMoveClientXRef.current - d.startX
      const totalDeltaDays = pxToDays(totalDeltaPx)
      if (totalDeltaDays !== 0) {
        onStageChange(d.stageId, {
          startDate: addDaysToDate(d.startStart, totalDeltaDays),
          endDate: addDaysToDate(d.startEnd, totalDeltaDays),
        })
      }
      // Остаток в пикселях: плавно притянем к сетке
      const snapOffsetPx = lastMoveOffsetPxRef.current - totalDeltaDays * pxPerDay
      if (Math.abs(snapOffsetPx) > 0.5) {
        setPostMoveSnapStageId(d.stageId)
        setPostMoveSnapOffsetPx(snapOffsetPx)
      }
    } else if (hadDrag && d.kind === 'resize' && onStageChange) {
      const totalDeltaPx = lastMoveClientXRef.current - d.startX
      const totalDeltaDays = pxToDays(totalDeltaPx)
      let newEnd = addDaysToDate(d.startEnd, totalDeltaDays)
      const startD = new Date(d.startStart).getTime()
      let endD = new Date(newEnd).getTime()
      if (endD < startD) newEnd = d.startStart
      onStageChange(d.stageId, { endDate: newEnd })
    }
    setDraggingStageId(null)
    setDraggingEventId(null)
    setDragMoveOffsetPx(0)
    setResizingStageId(null)
    setResizeInitialEnd(null)
    setDragResizeOffsetPx(0)
    setDeleteZoneActive(false)
    deleteZoneActiveRef.current = false
    dragRef.current = null
    if (hadDrag) justDraggedRef.current = true
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }, [handleMouseMove, onStageDelete, onStageChange, pxToDays])

  const startMove = (stageId: string, startDate: string, endDate: string, clientX: number) => {
    if (!canEdit || !onStageChange) return
    dragContainerTopRef.current = scrollContainerRef.current?.getBoundingClientRect().top ?? 0
    deleteZoneActiveRef.current = false
    setDeleteZoneActive(false)
    setDraggingStageId(stageId)
    dragRef.current = { kind: 'move', stageId, startX: clientX, startStart: startDate, startEnd: endDate }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const startResize = (stageId: string, endDate: string, clientX: number) => {
    if (!canEdit || !onStageChange) return
    const stage = stages.find((s) => s.id === stageId)
    if (!stage) return
    lastMoveClientXRef.current = clientX
    setResizingStageId(stageId)
    setResizeInitialEnd(endDate)
    setDragResizeOffsetPx(0)
    dragRef.current = { kind: 'resize', stageId, startX: clientX, startStart: stage.startDate, startEnd: endDate }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const startEventDrag = (eventId: string, date: string, clientX: number) => {
    if (!canEdit || !onEventChange) return
    setDraggingEventId(eventId)
    dragRef.current = { kind: 'event', eventId, startX: clientX, startDate: date }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }
  const allDates: Date[] = []
  stages.forEach((s) => {
    allDates.push(parseDate(s.startDate), parseDate(s.endDate))
  })
  events.forEach((e) => allDates.push(parseDate(e.date)))
  if (allDates.length === 0) {
    return (
      <section className="mb-12">
        <h2 className="text-2xl md:text-3xl font-normal heading-large mb-6">Timeline</h2>
        <p className="text-white/60 tracking-tighter">No stages or events</p>
      </section>
    )
  }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayTime = today.getTime()
  const dataMin = new Date(Math.min(...allDates.map((d) => d.getTime())))
  const dataMax = new Date(Math.max(...allDates.map((d) => d.getTime())))
  const DEFAULT_DAYS = 7
  // По умолчанию окно 7 дней: 3 до сегодня, сегодня, 3 после
  const openLeftDate = new Date(today)
  openLeftDate.setDate(openLeftDate.getDate() - 3)
  const openRightDate = new Date(today)
  openRightDate.setDate(openRightDate.getDate() + 3)
  const minDate = new Date(Math.min(dataMin.getTime(), openLeftDate.getTime()))
  const maxDate = new Date(Math.max(dataMax.getTime(), openRightDate.getTime()))
  const spanMs = maxDate.getTime() - minDate.getTime()
  const spanDays = Math.round(spanMs / (24 * 60 * 60 * 1000)) + 1
  if (spanDays < DEFAULT_DAYS) {
    maxDate.setTime(minDate.getTime())
    maxDate.setDate(maxDate.getDate() + DEFAULT_DAYS - 1)
  }
  const days = getDaysInRange(minDate, maxDate)
  const totalWidth = days.length * pxPerDay
  const scrollLeftOpen = Math.max(0, Math.round((openLeftDate.getTime() - minDate.getTime()) / (24 * 60 * 60 * 1000)) * pxPerDay)
  scrollLeftOpenRef.current = scrollLeftOpen

  const isTodayInRange =
    todayTime >= minDate.getTime() && todayTime <= maxDate.getTime()
  let todayIndex = isTodayInRange
    ? days.findIndex((d) => d.getTime() === todayTime)
    : -1
  if (todayIndex < 0 && todayTime < minDate.getTime()) todayIndex = 0
  if (todayIndex < 0 && todayTime > maxDate.getTime()) todayIndex = days.length - 1

  const leftForDate = (date: Date): number => {
    const t = date.getTime()
    const first = minDate.getTime()
    const diff = Math.round((t - first) / (24 * 60 * 60 * 1000))
    return diff * pxPerDay
  }

  const widthForRange = (start: Date, end: Date): number => {
    const daysDiff =
      Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1
    return Math.max(daysDiff * pxPerDay, pxPerDay * 0.6)
  }

  const canZoomOut = zoomIndex > 0
  const canZoomIn = zoomIndex < ZOOM_LEVELS.length - 1

  return (
    <section className={fillHeight ? 'h-full flex flex-col min-h-0' : 'mb-12'}>
      <div className={`flex items-center justify-between gap-4 flex-wrap flex-none ${fillHeight ? 'mb-4' : 'mb-6'}`}>
        <h2 className="text-3xl md:text-5xl font-normal heading-large">Timeline</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setZoomIndex((i) => Math.max(0, i - 1))}
            disabled={!canZoomOut}
            className="w-9 h-9 rounded-lg bg-white/15 text-white flex items-center justify-center text-lg leading-none disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/25 transition-colors"
            title="Zoom out"
            aria-label="Zoom out"
          >
            −
          </button>
          <span className="min-w-[3rem] text-center text-sm text-white/70 tracking-tighter" title="Zoom: pixels per day">
            {ZOOM_LEVELS[zoomIndex]}×
          </span>
          <button
            type="button"
            onClick={() => setZoomIndex((i) => Math.min(ZOOM_LEVELS.length - 1, i + 1))}
            disabled={!canZoomIn}
            className="w-9 h-9 rounded-lg bg-white/15 text-white flex items-center justify-center text-lg leading-none disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/25 transition-colors"
            title="Zoom in"
            aria-label="Zoom in"
          >
            +
          </button>
        </div>
        {headerAction}
      </div>
      <div className={`rounded-lg overflow-hidden relative ${fillHeight ? 'flex-1 min-h-0 flex flex-col' : ''}`} style={{ background: CARD_BLACK_GRADIENT }}>
        {draggingStageId && canEdit && onStageDelete && (
          <div
            className="absolute top-0 left-0 right-0 z-20 h-14 flex items-center justify-center pointer-events-none transition-colors duration-150 rounded-t-lg"
            style={{
              background: deleteZoneActive ? 'rgba(220,38,38,0.85)' : 'rgba(255,255,255,0.06)',
              color: deleteZoneActive ? 'white' : 'rgba(255,255,255,0.7)',
            }}
          >
            <span className="text-sm tracking-tighter">Release to delete</span>
          </div>
        )}
        <div
          ref={scrollContainerRef}
          className={`overflow-y-auto overflow-x-hidden scroll-smooth scrollbar-hide ${fillHeight ? 'min-h-0 flex-1' : ''}`}
          style={fillHeight ? { scrollBehavior: 'smooth' } : { maxHeight: TIMELINE_MAX_HEIGHT, scrollBehavior: 'smooth' }}
        >
          <div className="flex">
            {canEdit && onStageReorder && (
              <div
                className="flex-shrink-0 flex flex-col border-r border-white/10"
                style={{ width: 48 }}
              >
                <div style={{ height: HEADER_HEIGHT }} />
                {stages.map((stage, index) => (
                  <div
                    key={stage.id}
                    className="flex items-center justify-center gap-0.5"
                    style={{ height: ROW_HEIGHT }}
                  >
                    <button
                      type="button"
                      onClick={() => onStageReorder(stage.id, 'up')}
                      disabled={index === 0}
                      className="w-7 h-7 rounded bg-white/10 text-white/80 flex items-center justify-center text-sm leading-none disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/20 hover:text-white transition-colors"
                      title="Move stage up"
                      aria-label="Move stage up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => onStageReorder(stage.id, 'down')}
                      disabled={index === stages.length - 1}
                      className="w-7 h-7 rounded bg-white/10 text-white/80 flex items-center justify-center text-sm leading-none disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/20 hover:text-white transition-colors"
                      title="Move stage down"
                      aria-label="Move stage down"
                    >
                      ↓
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div
              ref={horizontalScrollRef}
              className="min-w-0 flex-1 overflow-x-auto scroll-smooth scrollbar-hide"
              style={{ scrollBehavior: 'smooth' }}
            >
          <div
            className="relative transition-[width,height] duration-200 ease-out"
            style={{
              width: totalWidth,
              height: HEADER_HEIGHT + stages.length * ROW_HEIGHT,
            }}
          >
            {/* Заголовок: дни; сегодня — выделенная ячейка без вертикальной линии */}
            <div
              className="flex bg-black"
              style={{ height: HEADER_HEIGHT }}
            >
              {days.map((d, i) => {
                const isToday = todayIndex >= 0 && i === todayIndex
                const narrow = pxPerDay < 44
                const label = narrow ? String(d.getDate()) : formatDayLabel(d)
                return (
                  <div
                    key={dayKey(d)}
                    className={`flex-shrink-0 flex items-center justify-center text-sm md:text-base tracking-tighter transition-[width,color,background-color] duration-200 ease-out whitespace-nowrap overflow-hidden ${isToday ? 'text-black bg-white rounded-md mx-0.5' : 'text-white/70'}`}
                    style={{ width: pxPerDay, minWidth: 0 }}
                    title={isToday ? 'Today' : formatDayLabel(d)}
                  >
                    <span className="block w-full text-center truncate">{label}</span>
                  </div>
                )
              })}
            </div>

            {/* Строки этапов: блок + события этого этапа */}
            {stages.map((stage) => {
              const start = parseDate(stage.startDate)
              const end = parseDate(stage.endDate)
              const isResizing = resizingStageId === stage.id && resizeInitialEnd != null
              const baseWidth = isResizing
                ? Math.max(widthForRange(start, parseDate(resizeInitialEnd!)) + dragResizeOffsetPx, pxPerDay * 0.6)
                : widthForRange(start, end)
              const left = leftForDate(start)
              const width = baseWidth
              const stageEvents = events.filter((e) => e.stageId === stage.id)
              // Этапы, начинающиеся левее видимой области: показываем только видимую часть
              const blockLeft = Math.max(0, left)
              const visibleWidth = left < 0 ? width + left : width
              const blockWidth = Math.min(Math.max(visibleWidth, 0), totalWidth - blockLeft)
              const showResize = canEdit && blockWidth >= 48
              const blockStyle = stageBlockStyle(stage, todayTime)
              const isDragging = draggingStageId === stage.id
              if (scrollToStageId && stage.id === scrollToStageId) {
                scrollTargetLeftRef.current = blockLeft
                scrollTargetWidthRef.current = blockWidth
              }
              return (
                <div
                  key={stage.id}
                  className="flex items-center relative"
                  style={{ height: ROW_HEIGHT }}
                >
                  <div
                    className={`absolute top-0 bottom-0 flex items-center rounded-lg ${!canEdit && onStageOpen ? 'cursor-pointer' : ''}`}
                    style={{
                      left: blockLeft + (isDragging ? dragMoveOffsetPx : (stage.id === postMoveSnapStageId ? postMoveSnapOffsetPx : 0)),
                      width: blockWidth,
                      minWidth: Math.min(64, blockWidth),
                      ...blockStyle,
                      transition: isDragging || isResizing
                        ? 'none'
                        : `left ${TRANSITION_NORMAL} ease-out, width ${TRANSITION_NORMAL}, background-color ${TRANSITION_NORMAL}, opacity ${TRANSITION_NORMAL}, transform ${TRANSITION_FAST}, box-shadow ${TRANSITION_FAST}`,
                      ...(isDragging
                        ? {
                            transform: 'scale(1.04) rotate(1deg)',
                            zIndex: 20,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                          }
                        : {}),
                    }}
                    title={canEdit ? 'Drag to move across days. Click to open.' : `${stage.name}: ${stage.startDate} – ${stage.endDate}. Click to open.`}
                    onClick={!canEdit ? () => onStageOpen?.(stage.id) : undefined}
                  >
                    {canEdit ? (
                      <>
                        <button
                          type="button"
                          data-stage-name
                          className="flex-shrink-0 flex items-center px-3 h-full max-w-full text-left cursor-pointer rounded-l-lg border-0 bg-transparent truncate text-base md:text-lg tracking-tighter transition-opacity duration-150 hover:opacity-90"
                          onClick={(e) => {
                            e.stopPropagation()
                            onStageOpen?.(stage.id)
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          title={onStageOpen ? 'Open stage' : undefined}
                        >
                          <span className="truncate">{stage.name}</span>
                        </button>
                        <div
                          className="flex-1 self-stretch cursor-grab active:cursor-grabbing min-w-2"
                          onMouseDown={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            startMove(stage.id, stage.startDate, stage.endDate, e.clientX)
                          }}
                          title="Drag to move"
                        />
                      </>
                    ) : (
                      <span className="px-3 truncate text-base md:text-lg tracking-tighter block w-full">
                        {stage.name}
                      </span>
                    )}
                    {showResize && (
                      <div
                        data-resize-handle
                        className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize flex items-center justify-center group"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          startResize(stage.id, stage.endDate, e.clientX)
                        }}
                        title="Drag to change length"
                      >
                        <span className="w-px h-full min-h-[1.5rem] bg-white/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
                      </div>
                    )}
                  </div>
                  {/* События пока отключены */}
                  {false &&
                    stageEvents.map((ev) => {
                      const evLeft = leftForDate(parseDate(ev.date)) + pxPerDay / 2
                      const tooltip = [ev.title, ev.date, ev.type].filter(Boolean).join(' · ')
                      const isDraggingEvent = draggingEventId === ev.id
                      return (
                        <div
                          key={ev.id}
                          className={`absolute top-1.5 -translate-x-1/2 flex flex-col items-center group z-[6] ${canEdit ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
                          style={{
                            left: evLeft,
                            transition: isDraggingEvent ? 'none' : `left ${TRANSITION_NORMAL}`,
                          }}
                          title={canEdit ? `${tooltip} — drag to move across days` : tooltip}
                          onMouseDown={(e) => {
                            if (!canEdit || !onEventChange) return
                            e.preventDefault()
                            e.stopPropagation()
                            startEventDrag(ev.id, ev.date, e.clientX)
                          }}
                        >
                          <div
                            className={`w-3 h-3 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-transform duration-200 ${isDraggingEvent ? 'scale-125 opacity-90' : 'group-hover:scale-125'}`}
                          />
                          <span
                            className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-1 rounded bg-black/90 text-xs md:text-sm text-white tracking-tighter whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-10"
                            style={{ transform: 'translateX(-50%)' }}
                          >
                            {ev.title}
                          </span>
                        </div>
                      )
                    })}
                </div>
              )
            })}
          </div>
          </div>
          </div>
        </div>
        {hasOverflowVertical && (
          <div
            className="absolute bottom-0 left-0 right-0 h-6 pointer-events-none z-10"
            style={{ background: BOTTOM_STRIPE_GRADIENT }}
            aria-hidden
          />
        )}
        {/* Полоски по краям только когда есть скрытый контент */}
        {horizontalOverflow.left && (
          <div
            className="absolute top-0 bottom-0 left-0 pointer-events-none z-10 transition-opacity duration-200"
            style={{ width: EDGE_GRADIENT_WIDTH, background: LEFT_EDGE_GRADIENT }}
            aria-hidden
          />
        )}
        {horizontalOverflow.right && (
          <div
            className="absolute top-0 bottom-0 right-0 pointer-events-none z-10 transition-opacity duration-200"
            style={{ width: EDGE_GRADIENT_WIDTH, background: RIGHT_EDGE_GRADIENT }}
            aria-hidden
          />
        )}
      </div>
    </section>
  )
}
