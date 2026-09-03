import { useState } from "react";
import Tooltip from "@mui/material/Tooltip";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Box from "@mui/material/Box";
import type { DailyLog, LogEvent as ApiLogEvent, DriverDetails } from "../api/types";

export interface LogEvent extends ApiLogEvent {
  is_continuation?: boolean;
}

interface ELDLogSheetProps {
  log: DailyLog;
  driverDetails?: DriverDetails;
}

const GRID_WIDTH = 1100;
const GRID_LEFT_MARGIN = 130;
const HOUR_WIDTH = (GRID_WIDTH - GRID_LEFT_MARGIN) / 24;
const ROW_HEIGHT = 40;
const GRID_TOP = 50;
const TOTALS_COL_WIDTH = 140;
const GRID_RIGHT = GRID_LEFT_MARGIN + 24 * HOUR_WIDTH;
const REMARKS_TOP = GRID_TOP + 4 * ROW_HEIGHT + 12;
const REMARKS_ROW_HEIGHT = 120;
const SVG_WIDTH = GRID_RIGHT + TOTALS_COL_WIDTH + 60;
const SVG_HEIGHT = REMARKS_TOP + REMARKS_ROW_HEIGHT + 20;

const LANE_ORDER = ["off_duty", "sleeper_berth", "driving", "on_duty"];
const LANE_LABELS = ["Off Duty", "Sleeper Berth", "Driving", "On Duty (Not Driving)"];

const HOUR_LABELS: string[] = [];
for (let i = 0; i <= 24; i++) {
  if (i === 0) HOUR_LABELS.push("Midnight");
  else if (i === 12) HOUR_LABELS.push("Noon");
  else HOUR_LABELS.push(String(i));
}

function timeToX(time: string): number {
  if (time === "00:00" || time === "0:00") {
    return GRID_LEFT_MARGIN;
  }
  const [h, m] = time.split(":").map(Number);
  return GRID_LEFT_MARGIN + (h + m / 60) * HOUR_WIDTH;
}

function endTimeToX(time: string, startTime: string): number {
  if (time === "00:00" || time === "0:00") {
    const [sh] = startTime.split(":").map(Number);
    if (sh > 0) {
      return GRID_LEFT_MARGIN + 24 * HOUR_WIDTH;
    }
  }
  return timeToX(time);
}

function laneY(status: string): number {
  const idx = LANE_ORDER.indexOf(status);
  const lane = idx >= 0 ? idx : 0;
  return GRID_TOP + lane * ROW_HEIGHT + ROW_HEIGHT / 2;
}

function buildStepPath(events: LogEvent[]): string {
  if (events.length === 0) return "";

  const sorted = [...events].sort((a, b) => {
    const aMin = timeToMinutes(a.start);
    const bMin = timeToMinutes(b.start);
    return aMin - bMin;
  });

  let d = "";
  let prevX: number | null = null;
  let prevY: number | null = null;

  for (let i = 0; i < sorted.length; i++) {
    const ev = sorted[i];
    const x1 = timeToX(ev.start);
    const x2 = endTimeToX(ev.end, ev.start);
    const y = laneY(ev.status);

    if (prevX === null || prevY === null) {
      d += `M ${x1} ${y}`;
    } else {
      if (Math.abs(prevY - y) > 0.5) {
        d += ` L ${x1} ${prevY} L ${x1} ${y}`;
      } else {
        d += ` L ${x1} ${y}`;
      }
    }

    d += ` L ${x2} ${y}`;
    prevX = x2;
    prevY = y;
  }

  return d;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function decimalToHoursMinutes(decimal: number): [string, string] {
  const totalMinutes = Math.round(decimal * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return [String(hours).padStart(2, "0"), String(minutes).padStart(2, "0")];
}

function getTransitionDots(events: LogEvent[]): Array<{ x: number; y: number; label: string }> {
  if (events.length === 0) return [];
  const sorted = [...events].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
  const dots: Array<{ x: number; y: number; label: string }> = [];
  for (const ev of sorted) {
    const statusText = LANE_LABELS[LANE_ORDER.indexOf(ev.status)] || ev.status;
    dots.push({ x: timeToX(ev.start), y: laneY(ev.status), label: `Duty change to ${statusText} at ${ev.start}` });
    dots.push({ x: endTimeToX(ev.end, ev.start), y: laneY(ev.status), label: `End of ${statusText} at ${ev.end}` });
  }
  const unique: Array<{ x: number; y: number; label: string }> = [];
  for (const d of dots) {
    if (!unique.some((u) => Math.abs(u.x - d.x) < 1 && Math.abs(u.y - d.y) < 1)) {
      unique.push(d);
    }
  }
  return unique;
}

export default function ELDLogSheet({ log, driverDetails }: ELDLogSheetProps) {
  const [showDots, setShowDots] = useState(true);
  const stepPath = buildStepPath(log.events);

  const totalsSum = log.totals.off_duty + log.totals.sleeper_berth + log.totals.driving + log.totals.on_duty;
  const totalsLeft = GRID_RIGHT + 15;

  const remarkEvents = (log.events as LogEvent[]).filter((e) => {
    if (!e.location && !e.note) return false;
    if (e.is_continuation) {
      return false;
    }
    return true;
  });

  return (
    <div style={{ width: "100%", overflowX: "auto", backgroundColor: "#fff", fontFamily: "sans-serif" }}>
      <Box sx={{ display: "flex", justifyContent: "flex-end", paddingX: 2, paddingTop: 1 }}>
        <FormControlLabel
          control={<Switch checked={showDots} onChange={(e) => setShowDots(e.target.checked)} size="small" />}
          label={<span style={{ fontSize: 12, fontWeight: 500 }}>Show Transition Dots</span>}
        />
      </Box>
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        width="100%"
        style={{ minWidth: 800, display: "block" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x={0} y={0} width={SVG_WIDTH} height={SVG_HEIGHT} fill="#ffffff" />

        {/* ── Header row 1: Date · Miles · Driver · Carrier ───── */}
        <text x={GRID_LEFT_MARGIN} y={13} fontSize={9} fontWeight={700} fill="#555" textAnchor="start">DATE</text>
        <text x={GRID_LEFT_MARGIN + 36} y={13} fontSize={10} fontWeight={700} fill="#111">{log.date_label}</text>

        <text x={GRID_LEFT_MARGIN + 200} y={13} fontSize={9} fontWeight={700} fill="#555">TOTAL MILES</text>
        <text x={GRID_LEFT_MARGIN + 263} y={13} fontSize={10} fontWeight={700} fill="#111" fontFamily="monospace">{log.total_miles}</text>

        <text x={GRID_LEFT_MARGIN + 340} y={13} fontSize={9} fontWeight={700} fill="#555">DRIVER</text>
        <text x={GRID_LEFT_MARGIN + 376} y={13} fontSize={10} fontWeight={600} fill="#111">
          {driverDetails?.driver_name || "_______________________"}
        </text>

        <text x={GRID_LEFT_MARGIN + 560} y={13} fontSize={9} fontWeight={700} fill="#555">CARRIER</text>
        <text x={GRID_LEFT_MARGIN + 600} y={13} fontSize={10} fontWeight={600} fill="#111">
          {driverDetails?.carrier_name || "_______________________"}
        </text>

        {/* ── Header row 2: Tractor # · Trailer # ──────────────── */}
        <text x={GRID_LEFT_MARGIN} y={28} fontSize={9} fontWeight={700} fill="#555">TRACTOR #</text>
        <text x={GRID_LEFT_MARGIN + 55} y={28} fontSize={10} fontWeight={600} fill="#111" fontFamily="monospace">
          {driverDetails?.tractor_number || "____________"}
        </text>

        <text x={GRID_LEFT_MARGIN + 200} y={28} fontSize={9} fontWeight={700} fill="#555">TRAILER #</text>
        <text x={GRID_LEFT_MARGIN + 255} y={28} fontSize={10} fontWeight={600} fill="#111" fontFamily="monospace">
          {driverDetails?.trailer_number || "____________"}
        </text>

        <line x1={GRID_LEFT_MARGIN} y1={33} x2={GRID_RIGHT} y2={33} stroke="#E2E8F0" strokeWidth={1} />

        {Array.from({ length: 25 }, (_, i) => {
          const x = GRID_LEFT_MARGIN + i * HOUR_WIDTH;
          const isEdge = i === 0 || i === 24;
          const isMajor = i % 6 === 0;
          return (
            <g key={`hline-${i}`}>
              <line
                x1={x}
                y1={GRID_TOP}
                x2={x}
                y2={GRID_TOP + 4 * ROW_HEIGHT}
                stroke={isMajor || isEdge ? "#444" : "#bbb"}
                strokeWidth={isMajor || isEdge ? 1 : 0.5}
              />
              {i < 24 && (
                <>
                  <text
                    x={x + HOUR_WIDTH / 2}
                    y={GRID_TOP - 4}
                    fontSize={i === 0 || i === 12 ? 7 : 8.5}
                    fill="#222"
                    textAnchor="middle"
                    fontWeight={i === 0 || i === 12 ? 700 : 400}
                  >
                    {HOUR_LABELS[i]}
                  </text>
                  <text
                    x={x + HOUR_WIDTH}
                    y={GRID_TOP + 4 * ROW_HEIGHT + 20}
                    fontSize={i === 0 || i === 12 ? 7 : 8.5}
                    fill="#222"
                    textAnchor="end"
                    fontWeight={i === 0 || i === 12 ? 700 : 400}
                  >
                    {HOUR_LABELS[i]}
                  </text>
                </>
              )}
              {i < 24 &&
                [1, 2, 3].map((q) => {
                  const qx = x + q * (HOUR_WIDTH / 4);
                  const tickH = q === 2 ? ROW_HEIGHT * 0.45 : ROW_HEIGHT * 0.25;
                  return LANE_ORDER.map((_, laneIdx) => {
                    const laneTopY = GRID_TOP + laneIdx * ROW_HEIGHT;
                    return (
                      <line
                        key={`tick-${i}-${q}-${laneIdx}`}
                        x1={qx}
                        y1={laneTopY}
                        x2={qx}
                        y2={laneTopY + tickH}
                        stroke="#bbb"
                        strokeWidth={0.5}
                      />
                    );
                  });
                })}
            </g>
          );
        })}

        {LANE_ORDER.map((_, i) => (
          <line
            key={`lane-div-${i}`}
            x1={GRID_LEFT_MARGIN}
            y1={GRID_TOP + i * ROW_HEIGHT}
            x2={GRID_RIGHT}
            y2={GRID_TOP + i * ROW_HEIGHT}
            stroke="#666"
            strokeWidth={i === 0 ? 1.5 : 1}
          />
        ))}
        <line
          x1={GRID_LEFT_MARGIN}
          y1={GRID_TOP + 4 * ROW_HEIGHT}
          x2={GRID_RIGHT}
          y2={GRID_TOP + 4 * ROW_HEIGHT}
          stroke="#666"
          strokeWidth={1.5}
        />

        <line x1={GRID_LEFT_MARGIN} y1={GRID_TOP} x2={GRID_LEFT_MARGIN} y2={GRID_TOP + 4 * ROW_HEIGHT} stroke="#444" strokeWidth={1.5} />
        <line x1={GRID_RIGHT} y1={GRID_TOP} x2={GRID_RIGHT} y2={GRID_TOP + 4 * ROW_HEIGHT} stroke="#444" strokeWidth={1.5} />

        {LANE_LABELS.map((label, i) => (
          <text
            key={`label-${i}`}
            x={GRID_LEFT_MARGIN - 8}
            y={GRID_TOP + i * ROW_HEIGHT + ROW_HEIGHT / 2 + 4}
            fontSize={9.5}
            fill="#111"
            textAnchor="end"
            fontWeight={600}
          >
            {label}
          </text>
        ))}

        {stepPath && (
          <path
            d={stepPath}
            fill="none"
            stroke="#000"
            strokeWidth={3}
            strokeLinejoin="miter"
            strokeLinecap="square"
          />
        )}

        {showDots && getTransitionDots(log.events).map((dot, i) => (
          <foreignObject
            key={`dot-${i}`}
            x={dot.x - 4}
            y={dot.y - 4}
            width={8}
            height={8}
            style={{ overflow: "visible" }}
          >
            <Tooltip title={dot.label} arrow placement="top">
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "#E53935",
                  cursor: "pointer",
                }}
              />
            </Tooltip>
          </foreignObject>
        ))}

        <text x={5} y={REMARKS_TOP + 4} fontSize={9} fontWeight={700} fill="#111">
          REMARKS
        </text>

        <line x1={GRID_LEFT_MARGIN} y1={REMARKS_TOP} x2={GRID_RIGHT} y2={REMARKS_TOP} stroke="#444" strokeWidth={1} />
        {Array.from({ length: 25 }, (_, i) => {
          const x = GRID_LEFT_MARGIN + i * HOUR_WIDTH;
          return (
            <g key={`rmk-tick-${i}`}>
              <line x1={x} y1={REMARKS_TOP} x2={x} y2={REMARKS_TOP + 8} stroke="#444" strokeWidth={1} />
              {i < 24 && [1, 2, 3].map((q) => (
                <line key={`rmk-qtick-${i}-${q}`} x1={x + q * (HOUR_WIDTH / 4)} y1={REMARKS_TOP} x2={x + q * (HOUR_WIDTH / 4)} y2={REMARKS_TOP + 4} stroke="#444" strokeWidth={0.5} />
              ))}
            </g>
          );
        })}

        {remarkEvents.map((ev, i) => {
          const x1 = timeToX(ev.start);
          const x2 = endTimeToX(ev.end, ev.start);
          const isDuration = (x2 - x1) > 2;
          const label = ev.location && ev.note
            ? `${ev.location} — ${ev.note}`
            : ev.location || ev.note || "";
          
          const bracketTop = REMARKS_TOP + 8;
          const bracketDepth = bracketTop + 20;

          if (isDuration) {
            const midX = (x1 + x2) / 2;
            return (
              <g key={`remark-${i}`}>
                <line x1={x1} y1={bracketTop} x2={x1} y2={bracketDepth} stroke="#000" strokeWidth={3} />
                <line x1={x1} y1={bracketDepth} x2={x2} y2={bracketDepth} stroke="#000" strokeWidth={3} />
                <line x1={x2} y1={bracketTop} x2={x2} y2={bracketDepth} stroke="#000" strokeWidth={3} />
                <line x1={midX} y1={bracketDepth} x2={midX} y2={bracketDepth + 10} stroke="#000" strokeWidth={3} />
                <text
                  x={midX}
                  y={bracketDepth + 18}
                  fontSize={8.5}
                  fill="#000"
                  fontWeight={600}
                  transform={`rotate(45, ${midX}, ${bracketDepth + 18})`}
                >
                  {label}
                </text>
              </g>
            );
          } else {
            return (
              <g key={`remark-${i}`}>
                <line x1={x1} y1={bracketTop} x2={x1} y2={bracketDepth + 10} stroke="#000" strokeWidth={3} />
                <text
                  x={x1 + 2}
                  y={bracketDepth + 18}
                  fontSize={8.5}
                  fill="#000"
                  fontWeight={600}
                  transform={`rotate(45, ${x1 + 2}, ${bracketDepth + 18})`}
                >
                  {label}
                </text>
              </g>
            );
          }
        })}

        {(() => {
          const TW = TOTALS_COL_WIDTH + 20;
          const BW = 20;
          const BH = 26;

          const hb1 = 15;
          const hb2 = 37;
          const mb1 = 88;
          const mb2 = 110;
          const divX = 72;

          const tableTop = GRID_TOP - 35;
          const tableBottom = GRID_TOP + 4 * ROW_HEIGHT + 32;

          const rows = LANE_ORDER.map((key) =>
            decimalToHoursMinutes(log.totals[key as keyof typeof log.totals])
          );
          const [totalHrs, totalMins] = decimalToHoursMinutes(totalsSum);
          const combinedVal = Number((log.totals.driving + log.totals.on_duty).toFixed(1));

          return (
            <g>
              <rect
                x={totalsLeft}
                y={tableTop}
                width={TW}
                height={tableBottom - tableTop}
                fill="#edf1fa"
                stroke="#444"
                strokeWidth={1}
              />

              <text x={totalsLeft + (hb1 + hb2 + BW) / 2} y={tableTop + 15} fontSize={9} fontWeight={700} fill="#111" textAnchor="middle">
                HOURS
              </text>
              <text x={totalsLeft + (mb1 + mb2 + BW) / 2} y={tableTop + 11} fontSize={7.5} fontWeight={700} fill="#111" textAnchor="middle">
                MINUTES
              </text>
              <text x={totalsLeft + (mb1 + mb2 + BW) / 2} y={tableTop + 20} fontSize={5.5} fill="#555" textAnchor="middle">
                TO BE
              </text>
              <text x={totalsLeft + (mb1 + mb2 + BW) / 2} y={tableTop + 28} fontSize={5.5} fill="#555" textAnchor="middle">
                00, 15, 30, 45
              </text>

              <line x1={totalsLeft} y1={GRID_TOP - 2} x2={totalsLeft + TW} y2={GRID_TOP - 2} stroke="#444" strokeWidth={0.75} />

              <line x1={totalsLeft + divX} y1={tableTop} x2={totalsLeft + divX} y2={tableBottom} stroke="#444" strokeWidth={0.75} />

              {rows.map(([hrs, mins], i) => {
                const cy = GRID_TOP + i * ROW_HEIGHT + ROW_HEIGHT / 2;
                const by = cy - BH / 2;
                return (
                  <g key={`tot-${i}`}>
                    <rect x={totalsLeft + hb1} y={by} width={BW} height={BH} fill="#fff" stroke="#333" strokeWidth={0.75} />
                    <text x={totalsLeft + hb1 + BW / 2} y={cy + 5} fontSize={14} fontWeight={700} fill="#000" textAnchor="middle" fontFamily="monospace">{hrs[0]}</text>
                    <rect x={totalsLeft + hb2} y={by} width={BW} height={BH} fill="#fff" stroke="#333" strokeWidth={0.75} />
                    <text x={totalsLeft + hb2 + BW / 2} y={cy + 5} fontSize={14} fontWeight={700} fill="#000" textAnchor="middle" fontFamily="monospace">{hrs[1]}</text>

                    <rect x={totalsLeft + mb1} y={by} width={BW} height={BH} fill="#fff" stroke="#333" strokeWidth={0.75} />
                    <text x={totalsLeft + mb1 + BW / 2} y={cy + 5} fontSize={14} fontWeight={700} fill="#000" textAnchor="middle" fontFamily="monospace">{mins[0]}</text>
                    <rect x={totalsLeft + mb2} y={by} width={BW} height={BH} fill="#fff" stroke="#333" strokeWidth={0.75} />
                    <text x={totalsLeft + mb2 + BW / 2} y={cy + 5} fontSize={14} fontWeight={700} fill="#000" textAnchor="middle" fontFamily="monospace">{mins[1]}</text>
                  </g>
                );
              })}

              <line x1={totalsLeft} y1={GRID_TOP + 4 * ROW_HEIGHT} x2={totalsLeft + TW} y2={GRID_TOP + 4 * ROW_HEIGHT} stroke="#444" strokeWidth={1} />

              {(() => {
                const tcy = GRID_TOP + 4 * ROW_HEIGHT + 16;
                const tby = tcy - BH / 2;
                return (
                  <g>
                    <rect x={totalsLeft + hb1} y={tby} width={BW} height={BH} fill="#fff" stroke="#333" strokeWidth={0.75} />
                    <text x={totalsLeft + hb1 + BW / 2} y={tcy + 5} fontSize={14} fontWeight={700} fill="#000" textAnchor="middle" fontFamily="monospace">{totalHrs[0]}</text>
                    <rect x={totalsLeft + hb2} y={tby} width={BW} height={BH} fill="#fff" stroke="#333" strokeWidth={0.75} />
                    <text x={totalsLeft + hb2 + BW / 2} y={tcy + 5} fontSize={14} fontWeight={700} fill="#000" textAnchor="middle" fontFamily="monospace">{totalHrs[1]}</text>
                    <rect x={totalsLeft + mb1} y={tby} width={BW} height={BH} fill="#fff" stroke="#333" strokeWidth={0.75} />
                    <text x={totalsLeft + mb1 + BW / 2} y={tcy + 5} fontSize={14} fontWeight={700} fill="#000" textAnchor="middle" fontFamily="monospace">{totalMins[0]}</text>
                    <rect x={totalsLeft + mb2} y={tby} width={BW} height={BH} fill="#fff" stroke="#333" strokeWidth={0.75} />
                    <text x={totalsLeft + mb2 + BW / 2} y={tcy + 5} fontSize={14} fontWeight={700} fill="#000" textAnchor="middle" fontFamily="monospace">{totalMins[1]}</text>
                  </g>
                );
              })()}

              <text x={totalsLeft + TW / 2} y={GRID_TOP + 4 * ROW_HEIGHT + 46} fontSize={7.5} fontWeight={700} fill="#111" textAnchor="middle">
                TOTAL HOURS
              </text>

              <circle
                cx={totalsLeft + TW / 2}
                cy={GRID_TOP + 4 * ROW_HEIGHT + 68}
                r={20}
                fill="none"
                stroke="#E53935"
                strokeWidth={2.5}
              />
              <text
                x={totalsLeft + TW / 2}
                y={GRID_TOP + 4 * ROW_HEIGHT + 73}
                fontSize={14}
                fontWeight={700}
                fill="#E53935"
                textAnchor="middle"
              >
                {combinedVal}
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
