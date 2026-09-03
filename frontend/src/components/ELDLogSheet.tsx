import { useState } from "react";
import Tooltip from "@mui/material/Tooltip";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { DailyLog, LogEvent as ApiLogEvent, DriverDetails } from "../api/types";

export interface LogEvent extends ApiLogEvent {
  is_continuation?: boolean;
}

interface ELDLogSheetProps {
  log: DailyLog;
  driverDetails?: DriverDetails;
}

const GRID_WIDTH = 1100;
const GRID_LEFT_MARGIN = 170;
const HOUR_WIDTH = (GRID_WIDTH - GRID_LEFT_MARGIN) / 24;
const ROW_HEIGHT = 40;

const HEADER_HEIGHT = 180;
const GRID_TOP = HEADER_HEIGHT + 20;

const TOTALS_COL_WIDTH = 0;
const GRID_RIGHT = GRID_LEFT_MARGIN + 24 * HOUR_WIDTH;
const REMARKS_TOP = GRID_TOP + 4 * ROW_HEIGHT + 12;
const REMARKS_ROW_HEIGHT = 120;

const FOOTER_HEIGHT = 80;

const SVG_WIDTH = GRID_RIGHT + 60;
const SVG_HEIGHT = REMARKS_TOP + REMARKS_ROW_HEIGHT + FOOTER_HEIGHT;

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
    return GRID_LEFT_MARGIN + 24 * HOUR_WIDTH;
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
  const sorted = [...events].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
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

function drawCharBoxes(x: number, y: number, value: string, maxLen: number, boxSize = 24) {
  const valArr = (value || "").padEnd(maxLen, " ").split("").slice(0, maxLen);
  return (
    <g>
      {valArr.map((char, i) => (
        <g key={`box-${i}`}>
          <rect x={x + i * boxSize} y={y} width={boxSize} height={boxSize} fill="#fff" stroke="#111" strokeWidth={1} />
          {char !== " " && (
            <text x={x + i * boxSize + boxSize / 2} y={y + boxSize * 0.75} fontSize={16} fontWeight={700} fill="#111" textAnchor="middle" fontFamily="monospace">
              {char}
            </text>
          )}
        </g>
      ))}
    </g>
  );
}

export default function ELDLogSheet({ log, driverDetails }: ELDLogSheetProps) {
  const [showDots, setShowDots] = useState(true);
  const [showDriverDetails, setShowDriverDetails] = useState(true);
  const stepPath = buildStepPath(log.events);
  const totalsSum = log.totals.off_duty + log.totals.sleeper_berth + log.totals.driving + log.totals.on_duty;

  const remarkEvents = (log.events as LogEvent[]).filter((e) => {
    if (!e.location && !e.note) return false;
    if (e.is_continuation) return false;
    return true;
  });

  const dd = driverDetails || {} as DriverDetails;

  return (
    <div style={{ width: "100%", overflowX: "auto", backgroundColor: "#fff", fontFamily: "sans-serif" }}>
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 3, paddingX: 2, paddingTop: 1 }}>
        <FormControlLabel
          control={<Switch checked={showDriverDetails} onChange={(e) => setShowDriverDetails(e.target.checked)} size="small" />}
          label={<span style={{ fontSize: 12, fontWeight: 500 }}>Show Driver Details</span>}
        />
        <FormControlLabel
          control={<Switch checked={showDots} onChange={(e) => setShowDots(e.target.checked)} size="small" />}
          label={<span style={{ fontSize: 12, fontWeight: 500 }}>Show Transition Dots</span>}
        />
      </Box>
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        width="100%"
        style={{ minWidth: 800, display: "block", color: "#3B82F6" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x={0} y={0} width={SVG_WIDTH} height={SVG_HEIGHT} fill="#ffffff" />

        <rect x={20} y={20} width={SVG_WIDTH - 40} height={HEADER_HEIGHT - 20} fill="#f8fafc" stroke="#e2e8f0" strokeWidth={1} rx={8} />

        <text x={40} y={50} fontSize={20} fill="#0f172a" fontWeight={700}>DRIVER'S DAILY LOG</text>
        <text x={40} y={65} fontSize={10} fill="#64748b">(ELECTRONIC LOGGING DEVICE RECORD)</text>

        <g transform={`translate(${SVG_WIDTH - 200}, 35)`}>
          <rect x={0} y={0} width={160} height={40} fill="#fff" stroke="#cbd5e1" strokeWidth={1} rx={4} />
          <text x={10} y={15} fontSize={9} fill="#64748b" fontWeight={600}>DATE</text>
          <text x={10} y={32} fontSize={14} fill="#0f172a" fontWeight={700}>{
            new Date(Date.now() + (log.day - 1) * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          }</text>
        </g>

        {showDriverDetails && (
          <g>

            <text x={40} y={105} fontSize={10} fill="#64748b" fontWeight={600}>DRIVER NAME</text>
            <text x={40} y={125} fontSize={14} fill="#0f172a" fontWeight={700}>{dd.driver_name || "N/A"}</text>

            <text x={220} y={105} fontSize={10} fill="#64748b" fontWeight={600}>DRIVER ID</text>
            <text x={220} y={125} fontSize={14} fill="#0f172a" fontWeight={700} fontFamily="monospace">{dd.driver_number || "N/A"}</text>

            <text x={380} y={105} fontSize={10} fill="#64748b" fontWeight={600}>CARRIER</text>
            <text x={380} y={125} fontSize={14} fill="#0f172a" fontWeight={700}>{dd.carrier_name || "N/A"}</text>

            <text x={380} y={145} fontSize={10} fill="#64748b" fontWeight={600}>MAIN OFFICE</text>
            <text x={380} y={165} fontSize={14} fill="#0f172a" fontWeight={700}>{dd.home_terminal || "N/A"}</text>


            <text x={700} y={105} fontSize={10} fill="#64748b" fontWeight={600}>TRACTOR UNIT</text>
            <text x={700} y={125} fontSize={14} fill="#0f172a" fontWeight={700} fontFamily="monospace">{dd.tractor_number || "N/A"}</text>

            <text x={840} y={105} fontSize={10} fill="#64748b" fontWeight={600}>TRAILER UNIT</text>
            <text x={840} y={125} fontSize={14} fill="#0f172a" fontWeight={700} fontFamily="monospace">{dd.trailer_number || "N/A"}</text>

            <text x={980} y={105} fontSize={10} fill="#64748b" fontWeight={600}>DISTANCE</text>
            <text x={980} y={125} fontSize={14} fill="#0f172a" fontWeight={700} fontFamily="monospace">{log.total_miles} mi</text>
          </g>
        )}
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
                    fontSize={i === 0 || i === 12 ? 10 : 8.5}
                    fill="#1D4ED8"
                    textAnchor="middle"
                    fontWeight={i === 0 || i === 12 ? 700 : 400}
                  >
                    {HOUR_LABELS[i]}
                  </text>
                  <text
                    x={x + HOUR_WIDTH}
                    y={GRID_TOP + 4 * ROW_HEIGHT + 20}
                    fontSize={i === 0 || i === 12 ? 10 : 8.5}
                    fill="#1D4ED8"
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
            stroke="#1D4ED8"
            strokeWidth={i === 0 ? 1.5 : 1}
          />
        ))}
        <line x1={GRID_LEFT_MARGIN} y1={GRID_TOP + 4 * ROW_HEIGHT} x2={GRID_RIGHT} y2={GRID_TOP + 4 * ROW_HEIGHT} stroke="#1D4ED8" strokeWidth={1.5} />
        <line x1={GRID_LEFT_MARGIN} y1={GRID_TOP} x2={GRID_LEFT_MARGIN} y2={GRID_TOP + 4 * ROW_HEIGHT} stroke="#1D4ED8" strokeWidth={1.5} />
        <line x1={GRID_RIGHT} y1={GRID_TOP} x2={GRID_RIGHT} y2={GRID_TOP + 4 * ROW_HEIGHT} stroke="#1D4ED8" strokeWidth={1.5} />

        {LANE_LABELS.map((label, i) => (
          <text
            key={`label-${i}`}
            x={GRID_LEFT_MARGIN - 8}
            y={GRID_TOP + i * ROW_HEIGHT + ROW_HEIGHT / 2 + 4}
            fontSize={9.5}
            fill="#1D4ED8"
            textAnchor="end"
            fontWeight={600}
          >
            {i + 1}: {label.toUpperCase()}
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
              <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#E53935", cursor: "pointer" }} />
            </Tooltip>
          </foreignObject>
        ))}

        <text x={20} y={REMARKS_TOP + 4} fontSize={14} fontWeight={700} fill="#1D4ED8">
          REMARKS
        </text>

        <line x1={GRID_LEFT_MARGIN} y1={REMARKS_TOP} x2={GRID_RIGHT} y2={REMARKS_TOP} stroke="#1D4ED8" strokeWidth={1} />
        {Array.from({ length: 25 }, (_, i) => {
          const x = GRID_LEFT_MARGIN + i * HOUR_WIDTH;
          return (
            <g key={`rmk-tick-${i}`}>
              <line x1={x} y1={REMARKS_TOP} x2={x} y2={REMARKS_TOP + 8} stroke="#1D4ED8" strokeWidth={1} />
              {i < 24 && [1, 2, 3].map((q) => (
                <line key={`rmk-qtick-${i}-${q}`} x1={x + q * (HOUR_WIDTH / 4)} y1={REMARKS_TOP} x2={x + q * (HOUR_WIDTH / 4)} y2={REMARKS_TOP + 4} stroke="#1D4ED8" strokeWidth={0.5} />
              ))}
            </g>
          );
        })}

        {remarkEvents.map((ev, i) => {
          const x1 = timeToX(ev.start);
          const x2 = endTimeToX(ev.end, ev.start);

          const isDuration = (x2 - x1) > 2 && (x2 - x1) < HOUR_WIDTH * 4;

          const bracketTop = REMARKS_TOP + 8;
          const bracketDepth = bracketTop + 10;

          const elements = [];

          if (isDuration && ev.location) {
            elements.push(
              <g key={`bracket-${i}`}>
                <line x1={x1} y1={bracketTop} x2={x1} y2={bracketDepth} stroke="#111" strokeWidth={2.5} />
                <line x1={x1} y1={bracketDepth} x2={x2} y2={bracketDepth} stroke="#111" strokeWidth={2.5} />
                <line x1={x2} y1={bracketTop} x2={x2} y2={bracketDepth} stroke="#111" strokeWidth={2.5} />
              </g>
            );

            const labelStr = ev.note ? Math.max(ev.location.length, ev.note.length) : ev.location.length;
            const locLen = Math.max(30, labelStr * 5.2 + 5);
            elements.push(
              <g key={`loc-note-${i}`}>
                <line x1={x1} y1={bracketDepth} x2={x1 - locLen} y2={bracketDepth + locLen} stroke="#111" strokeWidth={2.5} />
                <text x={x1 - 2} y={bracketDepth - 2} fontSize={8.5} fill="#111" fontWeight={700} textAnchor="end" transform={`rotate(-45, ${x1}, ${bracketDepth})`}>
                  {ev.location}
                </text>
                {ev.note && (
                  <text x={x1 - 2} y={bracketDepth + 8} fontSize={8.5} fill="#111" fontWeight={700} textAnchor="end" transform={`rotate(-45, ${x1}, ${bracketDepth})`}>
                    {ev.note}
                  </text>
                )}
              </g>
            );
          } else {
            const labelStr = (ev.location && ev.note) ? Math.max(ev.location.length, ev.note.length) : (ev.location || ev.note || "").length;
            if (labelStr > 0) {
              const len = Math.max(30, labelStr * 5.2 + 5);
              elements.push(
                <g key={`single-${i}`}>
                  <line x1={x1} y1={bracketTop} x2={x1} y2={bracketDepth} stroke="#111" strokeWidth={2.5} />
                  <line x1={x1} y1={bracketDepth} x2={x1 - len} y2={bracketDepth + len} stroke="#111" strokeWidth={2.5} />
                  {ev.location && (
                    <text x={x1 - 2} y={bracketDepth - 2} fontSize={8.5} fill="#111" fontWeight={700} textAnchor="end" transform={`rotate(-45, ${x1}, ${bracketDepth})`}>
                      {ev.location}
                    </text>
                  )}
                  {ev.note && (
                    <text x={x1 - 2} y={bracketDepth + (ev.location ? 8 : -2)} fontSize={8.5} fill="#111" fontWeight={700} textAnchor="end" transform={`rotate(-45, ${x1}, ${bracketDepth})`}>
                      {ev.note}
                    </text>
                  )}
                </g>
              );
            }
          }

          return <g key={`remark-group-${i}`}>{elements}</g>;
        })}


        {(() => {
          const footY = REMARKS_TOP + REMARKS_ROW_HEIGHT + 30;

          return (
            <g>
              <rect x={20} y={footY} width={SVG_WIDTH - 40} height={60} fill="#f8fafc" stroke="#e2e8f0" strokeWidth={1} rx={8} />

              <text x={40} y={footY + 25} fontSize={10} fill="#64748b" fontWeight={600}>SHIPPER</text>
              <text x={40} y={footY + 45} fontSize={14} fill="#0f172a" fontWeight={700}>{dd.shipper || "N/A"}</text>

              <text x={400} y={footY + 25} fontSize={10} fill="#64748b" fontWeight={600}>COMMODITY</text>
              <text x={400} y={footY + 45} fontSize={14} fill="#0f172a" fontWeight={700}>{dd.commodity || "N/A"}</text>

              <text x={760} y={footY + 25} fontSize={10} fill="#64748b" fontWeight={600}>LOAD NUMBER</text>
              <text x={760} y={footY + 45} fontSize={14} fill="#0f172a" fontWeight={700} fontFamily="monospace">{dd.load_number || "N/A"}</text>

            </g>
          );
        })()}

      </svg>


      <Box sx={{ p: 3, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 2, bgcolor: "#f1f5f9", borderTop: "1px solid #e2e8f0" }}>
        {LANE_ORDER.map((mode, i) => {
          const val = log.totals[mode as keyof typeof log.totals];
          const hrs = Math.floor(val);
          const mins = Math.round((val - hrs) * 60);
          return (
            <Box key={`summary-${i}`} sx={{ p: 2, bgcolor: "#fff", borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", mb: 0.5 }}>{LANE_LABELS[i]}</Typography>
              <Typography sx={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", fontFamily: "monospace" }}>{hrs}h {mins}m</Typography>
            </Box>
          );
        })}
        <Box sx={{ p: 2, bgcolor: "primary.main", borderRadius: 2, boxShadow: "0 4px 6px rgba(37,99,235,0.2)", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", mb: 0.5 }}>Total Hours</Typography>
          <Typography sx={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff", fontFamily: "monospace" }}>{Math.floor(totalsSum)}h {Math.round((totalsSum - Math.floor(totalsSum)) * 60).toString().padStart(2, '0')}m</Typography>
        </Box>
      </Box>

    </div>
  );
}
