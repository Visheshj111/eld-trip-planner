import { useState, useContext, useEffect } from "react";
import Tooltip from "@mui/material/Tooltip";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import type { DailyLog, LogEvent as ApiLogEvent, DriverDetails } from "../api/types";
import { ThemeContext } from "../ThemeContext";

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


const TOTALS_COL_WIDTH = 0;
const GRID_RIGHT = GRID_LEFT_MARGIN + 24 * HOUR_WIDTH;
const REMARKS_ROW_HEIGHT = 120;

const FOOTER_HEIGHT = 120;

const SVG_WIDTH = GRID_RIGHT + 60;

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

function laneY(status: string, gridTop: number): number {
  const idx = LANE_ORDER.indexOf(status);
  const lane = idx >= 0 ? idx : 0;
  return gridTop + lane * ROW_HEIGHT + ROW_HEIGHT / 2;
}

function buildStepPath(events: LogEvent[], gridTop: number): string {
  if (events.length === 0) return "";
  const sorted = [...events].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
  let d = "";
  let prevX: number | null = null;
  let prevY: number | null = null;

  for (let i = 0; i < sorted.length; i++) {
    const ev = sorted[i];
    const x1 = timeToX(ev.start);
    const x2 = endTimeToX(ev.end, ev.start);
    const y = laneY(ev.status, gridTop);

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

function getTransitionDots(events: LogEvent[], gridTop: number): Array<{ x: number; y: number; label: string }> {
  if (events.length === 0) return [];
  const sorted = [...events].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
  const dots: Array<{ x: number; y: number; label: string }> = [];
  for (const ev of sorted) {
    const statusText = LANE_LABELS[LANE_ORDER.indexOf(ev.status)] || ev.status;
    dots.push({ x: timeToX(ev.start), y: laneY(ev.status, gridTop), label: `Duty change to ${statusText} at ${ev.start}` });
    dots.push({ x: endTimeToX(ev.end, ev.start), y: laneY(ev.status, gridTop), label: `End of ${statusText} at ${ev.end}` });
  }
  const unique: Array<{ x: number; y: number; label: string }> = [];
  for (const d of dots) {
    if (!unique.some((u) => Math.abs(u.x - d.x) < 1 && Math.abs(u.y - d.y) < 1)) {
      unique.push(d);
    }
  }
  return unique;
}

function drawCharBoxes(x: number, y: number, value: string, maxLen: number, cLine: string, boxSize = 24) {
  const valArr = (value || "").padEnd(maxLen, " ").split("").slice(0, maxLen);
  return (
    <g>
      {valArr.map((char, i) => (
        <g key={`box-${i}`}>
          <rect x={x + i * boxSize} y={y} width={boxSize} height={boxSize} fill="#fff" stroke={cLine} strokeWidth={1} />
          {char !== " " && (
            <text x={x + i * boxSize + boxSize / 2} y={y + boxSize * 0.75} fontSize={16} fontWeight={700} fill={cLine} textAnchor="middle" fontFamily="'JetBrains Mono', monospace">
              {char}
            </text>
          )}
        </g>
      ))}
    </g>
  );
}

export default function ELDLogSheet({ log, driverDetails }: ELDLogSheetProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { unit } = useContext(ThemeContext);

  const cBg = isDark ? "#0C0A09" : "#ffffff";
  const cBox = isDark ? "#1C1917" : "#FAF9F7";
  const cStroke = isDark ? "#292524" : "#E7E5E4";
  const cText = isDark ? "#FAFAF9" : "#1C1917";
  const cMuted = isDark ? "#A8A29E" : "#78716C";
  const cLine = isDark ? "#FAFAF9" : "#1C1917";
  const cGridMajor = isDark ? "#A8A29E" : "#57534E";
  const cGridMinor = isDark ? "#44403C" : "#D6D3D1";
  const cAccent = theme.palette.primary.main;

  const dd = driverDetails || {} as DriverDetails;

  const hasAnyDetail = Boolean(
    dd.driver_name || dd.driver_number || dd.carrier_name ||
    dd.home_terminal || dd.tractor_number || dd.trailer_number ||
    dd.shipper || dd.commodity || dd.load_number
  );

  const [showDots, setShowDots] = useState(true);
  const [showDriverDetails, setShowDriverDetails] = useState(hasAnyDetail);

  useEffect(() => {
    if (hasAnyDetail) {
      setShowDriverDetails(true);
    }
  }, [hasAnyDetail]);

  const currentHeaderHeight = showDriverDetails ? 180 : 70;
  const gridTop = currentHeaderHeight + 20;
  const remarksTop = gridTop + 4 * ROW_HEIGHT + 12;
  const svgHeight = remarksTop + REMARKS_ROW_HEIGHT + FOOTER_HEIGHT;

  const stepPath = buildStepPath(log.events, gridTop);
  const transitionDots = getTransitionDots(log.events, gridTop);

  const totalsSum = log.totals.off_duty + log.totals.sleeper_berth + log.totals.driving + log.totals.on_duty;

  const remarkEvents = (log.events as LogEvent[]).filter((e) => {
    if (!e.location && !e.note) return false;
    if (e.is_continuation) return false;
    return true;
  });



  return (
    <div style={{ width: "100%", overflowX: "auto", backgroundColor: "transparent", fontFamily: "'DM Sans', sans-serif" }}>
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 3, paddingX: 2, paddingTop: 1 }}>
        <FormControlLabel
          control={<Switch checked={showDriverDetails} onChange={(e) => setShowDriverDetails(e.target.checked)} size="small" />}
          label={<span style={{ fontSize: 12, fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>Show Driver Details</span>}
        />
        <FormControlLabel
          control={<Switch checked={showDots} onChange={(e) => setShowDots(e.target.checked)} size="small" />}
          label={<span style={{ fontSize: 12, fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>Show Transition Dots</span>}
        />
      </Box>
      <style>{`
.anim-svg * {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
`}</style>
      <svg className="anim-svg"
        viewBox={`0 0 ${SVG_WIDTH} ${svgHeight}`}
        width="100%"
        style={{ minWidth: 800, display: "block", color: cAccent }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x={1} y={1} width={SVG_WIDTH - 2} height={svgHeight - 2} fill={cBg} rx={24} stroke={cStroke} strokeWidth={1} />

        <rect x={20} y={20} width={SVG_WIDTH - 40} height={currentHeaderHeight - 20} fill={cBox} stroke={cStroke} strokeWidth={1.5} rx={12} />

        <g onClick={() => setShowDriverDetails(!showDriverDetails)} style={{ cursor: "pointer" }}>
          <text x={40} y={showDriverDetails ? 50 : 38} fontSize={showDriverDetails ? 20 : 16} fill={cText} fontWeight={700} fontFamily="'Outfit', sans-serif">DRIVER'S DAILY LOG</text>
          <text x={40} y={showDriverDetails ? 65 : 54} fontSize={showDriverDetails ? 10 : 8} fill={cMuted} fontFamily="'JetBrains Mono', monospace">(ELECTRONIC LOGGING DEVICE RECORD)</text>
        </g>

        <g transform={`translate(${SVG_WIDTH - (showDriverDetails ? 200 : 160)}, ${showDriverDetails ? 35 : 30})`}>
          <rect x={0} y={0} width={showDriverDetails ? 160 : 120} height={showDriverDetails ? 40 : 30} fill={cBox} stroke={cStroke} strokeWidth={1.5} rx={8} />
          <text x={10} y={showDriverDetails ? 15 : 11} fontSize={showDriverDetails ? 9 : 7} fill={cMuted} fontWeight={600} fontFamily="'JetBrains Mono', monospace">DATE</text>
          <text x={10} y={showDriverDetails ? 32 : 23} fontSize={showDriverDetails ? 14 : 11} fill={cText} fontWeight={700} fontFamily="'Outfit', sans-serif">{
            new Date(Date.now() + (log.day - 1) * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          }</text>
        </g>

        <g style={{ opacity: showDriverDetails ? 1 : 0, pointerEvents: showDriverDetails ? "auto" : "none" }}>

          <text x={40} y={105} fontSize={10} fill={cMuted} fontWeight={600} fontFamily="'JetBrains Mono', monospace">DRIVER NAME</text>
          <text x={40} y={125} fontSize={14} fill={cText} fontWeight={700} fontFamily="'Outfit', sans-serif">{dd.driver_name || "N/A"}</text>

          <text x={220} y={105} fontSize={10} fill={cMuted} fontWeight={600} fontFamily="'JetBrains Mono', monospace">DRIVER ID</text>
          <text x={220} y={125} fontSize={14} fill={cText} fontWeight={700} fontFamily="'JetBrains Mono', monospace">{dd.driver_number || "N/A"}</text>

          <text x={380} y={105} fontSize={10} fill={cMuted} fontWeight={600} fontFamily="'JetBrains Mono', monospace">CARRIER</text>
          <text x={380} y={125} fontSize={14} fill={cText} fontWeight={700} fontFamily="'Outfit', sans-serif">{dd.carrier_name || "N/A"}</text>

          <text x={380} y={145} fontSize={10} fill={cMuted} fontWeight={600} fontFamily="'JetBrains Mono', monospace">MAIN OFFICE</text>
          <text x={380} y={165} fontSize={14} fill={cText} fontWeight={700} fontFamily="'Outfit', sans-serif">{dd.home_terminal || "N/A"}</text>


          <text x={700} y={105} fontSize={10} fill={cMuted} fontWeight={600} fontFamily="'JetBrains Mono', monospace">TRACTOR UNIT</text>
          <text x={700} y={125} fontSize={14} fill={cText} fontWeight={700} fontFamily="'JetBrains Mono', monospace">{dd.tractor_number || "N/A"}</text>

          <text x={840} y={105} fontSize={10} fill={cMuted} fontWeight={600} fontFamily="'JetBrains Mono', monospace">TRAILER UNIT</text>
          <text x={840} y={125} fontSize={14} fill={cText} fontWeight={700} fontFamily="'JetBrains Mono', monospace">{dd.trailer_number || "N/A"}</text>

          <text x={980} y={105} fontSize={10} fill={cMuted} fontWeight={600} fontFamily="'JetBrains Mono', monospace">DAILY DISTANCE</text>
          <text x={980} y={125} fontSize={14} fill={cText} fontWeight={700} fontFamily="'JetBrains Mono', monospace">
            {(unit === "km" ? log.total_miles * 1.60934 : log.total_miles).toFixed(1)} {unit}
          </text>
        </g>
        {Array.from({ length: 25 }, (_, i) => {
          const x = GRID_LEFT_MARGIN + i * HOUR_WIDTH;
          const isEdge = i === 0 || i === 24;
          const isMajor = i % 6 === 0;
          return (
            <g key={`hline-${i}`}>
              <line
                x1={x}
                y1={gridTop}
                x2={x}
                y2={gridTop + 4 * ROW_HEIGHT}
                stroke={isMajor || isEdge ? cGridMajor : cGridMinor}
                strokeWidth={isMajor || isEdge ? 1 : 0.5}
              />
              <text
                x={x}
                y={gridTop - 4}
                fontSize={i === 0 || i === 12 || i === 24 ? 10 : 8.5}
                fill={cAccent}
                textAnchor="middle"
                fontWeight={i === 0 || i === 12 || i === 24 ? 700 : 400}
                fontFamily="'JetBrains Mono', monospace"
              >
                {HOUR_LABELS[i]}
              </text>
              <text
                x={x}
                y={gridTop + 4 * ROW_HEIGHT + 10}
                fontSize={i === 0 || i === 12 || i === 24 ? 10 : 8.5}
                fill={cAccent}
                textAnchor="middle"
                fontWeight={i === 0 || i === 12 || i === 24 ? 700 : 400}
                fontFamily="'JetBrains Mono', monospace"
              >
                {HOUR_LABELS[i]}
              </text>
              {i < 24 &&
                [1, 2, 3].map((q) => {
                  const qx = x + q * (HOUR_WIDTH / 4);
                  const tickH = q === 2 ? ROW_HEIGHT * 0.45 : ROW_HEIGHT * 0.25;
                  return LANE_ORDER.map((_, laneIdx) => {
                    const laneTopY = gridTop + laneIdx * ROW_HEIGHT;
                    return (
                      <line
                        key={`tick-${i}-${q}-${laneIdx}`}
                        x1={qx}
                        y1={laneTopY}
                        x2={qx}
                        y2={laneTopY + tickH}
                        stroke={isDark ? "#A8A29E" : "#1C1917"}
                        strokeWidth={1}
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
            y1={gridTop + i * ROW_HEIGHT}
            x2={GRID_RIGHT}
            y2={gridTop + i * ROW_HEIGHT}
            stroke={cAccent}
            strokeWidth={i === 0 ? 1.5 : 1}
          />
        ))}
        <line x1={GRID_LEFT_MARGIN} y1={gridTop + 4 * ROW_HEIGHT} x2={GRID_RIGHT} y2={gridTop + 4 * ROW_HEIGHT} stroke={cAccent} strokeWidth={1.5} />
        <line x1={GRID_LEFT_MARGIN} y1={gridTop} x2={GRID_LEFT_MARGIN} y2={gridTop + 4 * ROW_HEIGHT} stroke={cAccent} strokeWidth={1.5} />
        <line x1={GRID_RIGHT} y1={gridTop} x2={GRID_RIGHT} y2={gridTop + 4 * ROW_HEIGHT} stroke={cAccent} strokeWidth={1.5} />

        {LANE_LABELS.map((label, i) => (
          <text
            key={`label-${i}`}
            x={GRID_LEFT_MARGIN - 8}
            y={gridTop + i * ROW_HEIGHT + ROW_HEIGHT / 2 + 4}
            fontSize={9.5}
            fill={cAccent}
            textAnchor="end"
            fontWeight={600}
            fontFamily="'DM Sans', sans-serif"
          >
            {i + 1}: {label.toUpperCase()}
          </text>
        ))}

        {stepPath && (
          <path
            d={stepPath}
            fill="none"
            stroke={cLine}
            strokeWidth={3}
            strokeLinejoin="miter"
            strokeLinecap="square"
          />
        )}

        {showDots && transitionDots.map((dot, i) => (
          <foreignObject
            key={`dot-${i}`}
            x={dot.x - 4}
            y={dot.y - 4}
            width={8}
            height={8}
            style={{ overflow: "visible" }}
          >
            <Tooltip title={dot.label} arrow placement="top">
              <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#DC2626", cursor: "pointer" }} />
            </Tooltip>
          </foreignObject>
        ))}

        <text x={20} y={remarksTop + 4} fontSize={14} fontWeight={700} fill={cAccent} fontFamily="'Outfit', sans-serif">
          REMARKS
        </text>

        <line x1={GRID_LEFT_MARGIN} y1={remarksTop} x2={GRID_RIGHT} y2={remarksTop} stroke={cAccent} strokeWidth={1} />
        {Array.from({ length: 25 }, (_, i) => {
          const x = GRID_LEFT_MARGIN + i * HOUR_WIDTH;
          return (
            <g key={`rmk-tick-${i}`}>
              <line x1={x} y1={remarksTop} x2={x} y2={remarksTop + 8} stroke={cAccent} strokeWidth={1} />
              {i < 24 && [1, 2, 3].map((q) => (
                <line key={`rmk-qtick-${i}-${q}`} x1={x + q * (HOUR_WIDTH / 4)} y1={remarksTop} x2={x + q * (HOUR_WIDTH / 4)} y2={remarksTop + 4} stroke={cAccent} strokeWidth={1.5} />
              ))}
            </g>
          );
        })}

        {remarkEvents.map((ev, i) => {
          const x1 = timeToX(ev.start);
          const x2 = endTimeToX(ev.end, ev.start);

          const isDuration = (x2 - x1) > 2 && (x2 - x1) < HOUR_WIDTH * 4;

          const bracketTop = remarksTop + 8;
          const bracketDepth = bracketTop + 10;

          const elements = [];

          if (isDuration && ev.location) {
            elements.push(
              <g key={`bracket-${i}`}>
                <line x1={x1} y1={bracketTop} x2={x1} y2={bracketDepth} stroke={cLine} strokeWidth={2.5} />
                <line x1={x1} y1={bracketDepth} x2={x2} y2={bracketDepth} stroke={cLine} strokeWidth={2.5} />
                <line x1={x2} y1={bracketTop} x2={x2} y2={bracketDepth} stroke={cLine} strokeWidth={2.5} />
              </g>
            );

            const locLen = 90;
            elements.push(
              <g key={`loc-note-${i}`}>
                <line x1={x1} y1={bracketDepth} x2={x1 - locLen} y2={bracketDepth + locLen} stroke={cLine} strokeWidth={2.5} />
                <text x={x1 - 2} y={bracketDepth - 2} fontSize={8.5} fill={cLine} fontWeight={700} textAnchor="end" transform={`rotate(-45, ${x1}, ${bracketDepth})`} fontFamily="'DM Sans', sans-serif">
                  {ev.location}
                </text>
                {ev.note && (
                  <text x={x1 - 2} y={bracketDepth + 8} fontSize={8.5} fill={cLine} fontWeight={700} textAnchor="end" transform={`rotate(-45, ${x1}, ${bracketDepth})`} fontFamily="'DM Sans', sans-serif">
                    {ev.note}
                  </text>
                )}
              </g>
            );
          } else {
            const labelStr = (ev.location && ev.note) ? Math.max(ev.location.length, ev.note.length) : (ev.location || ev.note || "").length;
            if (labelStr > 0) {
              const len = 90;
              elements.push(
                <g key={`single-${i}`}>
                  <line x1={x1} y1={bracketTop} x2={x1} y2={bracketDepth} stroke={cLine} strokeWidth={2.5} />
                  <line x1={x1} y1={bracketDepth} x2={x1 - len} y2={bracketDepth + len} stroke={cLine} strokeWidth={2.5} />
                  {ev.location && (
                    <text x={x1 - 2} y={bracketDepth - 2} fontSize={8.5} fill={cLine} fontWeight={700} textAnchor="end" transform={`rotate(-45, ${x1}, ${bracketDepth})`} fontFamily="'DM Sans', sans-serif">
                      {ev.location}
                    </text>
                  )}
                  {ev.note && (
                    <text x={x1 - 2} y={bracketDepth + (ev.location ? 8 : -2)} fontSize={8.5} fill={cLine} fontWeight={700} textAnchor="end" transform={`rotate(-45, ${x1}, ${bracketDepth})`} fontFamily="'DM Sans', sans-serif">
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
          const footY = remarksTop + REMARKS_ROW_HEIGHT + 30;

          return (
            <g>
              <rect x={20} y={footY} width={SVG_WIDTH - 40} height={60} fill={cBox} stroke={cStroke} strokeWidth={1.5} rx={12} />

              <text x={40} y={footY + 25} fontSize={10} fill={cMuted} fontWeight={600} fontFamily="'JetBrains Mono', monospace">SHIPPER</text>
              <text x={40} y={footY + 45} fontSize={14} fill={cText} fontWeight={700} fontFamily="'Outfit', sans-serif">{dd.shipper || "N/A"}</text>

              <text x={400} y={footY + 25} fontSize={10} fill={cMuted} fontWeight={600} fontFamily="'JetBrains Mono', monospace">COMMODITY</text>
              <text x={400} y={footY + 45} fontSize={14} fill={cText} fontWeight={700} fontFamily="'Outfit', sans-serif">{dd.commodity || "N/A"}</text>

              <text x={760} y={footY + 25} fontSize={10} fill={cMuted} fontWeight={600} fontFamily="'JetBrains Mono', monospace">LOAD NUMBER</text>
              <text x={760} y={footY + 45} fontSize={14} fill={cText} fontWeight={700} fontFamily="'JetBrains Mono', monospace">{dd.load_number || "N/A"}</text>

            </g>
          );
        })()}

      </svg>


      <Box sx={{ minWidth: 800, p: 3, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 2, bgcolor: isDark ? "#0C0A09" : "#FAF9F7", borderRadius: 3, border: `1px solid ${cStroke}`, mt: 2 }}>
        {LANE_ORDER.map((mode, i) => {
          const val = log.totals[mode as keyof typeof log.totals];
          const hrs = Math.floor(val);
          const mins = Math.round((val - hrs) * 60);
          return (
            <Box key={`summary-${i}`} sx={{
              p: 2,
              bgcolor: isDark ? "#1C1917" : "#fff",
              borderRadius: 3,
              boxShadow: isDark ? "0 1px 3px rgba(0,0,0,0.3)" : "0 1px 3px rgba(28,25,23,0.06)",
              border: `1px solid ${cStroke}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: isDark ? "#14B8A6" : "#0D9488",
                boxShadow: isDark ? "0 2px 8px rgba(20,184,166,0.15)" : "0 2px 8px rgba(13,148,136,0.1)",
              },
            }}>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: cMuted, textTransform: "uppercase", mb: 0.5, fontFamily: "'JetBrains Mono', monospace" }}>{LANE_LABELS[i]}</Typography>
              <Typography sx={{ fontSize: "1.25rem", fontWeight: 800, color: cText, fontFamily: "'JetBrains Mono', monospace" }}>{hrs}h {mins}m</Typography>
            </Box>
          );
        })}
        <Box sx={{
          p: 2,
          background: cAccent,
          borderRadius: 3,
          border: `1px solid ${theme.palette.primary.dark}`,
          boxShadow: isDark ? "0 1px 3px rgba(0,0,0,0.3)" : `0 1px 3px ${theme.palette.primary.light}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}>
          <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", mb: 0.5, fontFamily: "'JetBrains Mono', monospace" }}>Total Hours</Typography>
          <Typography sx={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff", fontFamily: "'JetBrains Mono', monospace" }}>{Math.floor(totalsSum)}h {Math.round((totalsSum - Math.floor(totalsSum)) * 60).toString().padStart(2, '0')}m</Typography>
        </Box>
      </Box>

    </div>
  );
}
