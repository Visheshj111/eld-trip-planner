import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import type { DailyLog, LogEvent } from "../api/types";

interface ELDLogSheetProps {
  log: DailyLog;
}

const GRID_LEFT = 130;
const GRID_TOP = 65;
const GRID_WIDTH = 720;
const GRID_HEIGHT = 200;
const LANE_HEIGHT = GRID_HEIGHT / 4;
const HOUR_WIDTH = GRID_WIDTH / 24;
const SVG_WIDTH = GRID_LEFT + GRID_WIDTH + 170;
const REMARKS_TOP = GRID_TOP + GRID_HEIGHT + 15;
const TOTALS_LEFT = GRID_LEFT + GRID_WIDTH + 20;

const LANE_LABELS = ["Off Duty", "Sleeper Berth", "Driving", "On Duty (ND)"];

const STATUS_TO_LANE: Record<string, number> = {
  off_duty: 0,
  sleeper_berth: 1,
  driving: 2,
  on_duty: 3,
};

const LANE_COLORS = ["#5E6C84", "#7A869A", "#0052CC", "#FF991F"];
const LANE_BG = ["rgba(94,108,132,0.06)", "rgba(122,134,154,0.06)", "rgba(0,82,204,0.06)", "rgba(255,153,31,0.06)"];

function timeStringToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToX(minutes: number): number {
  return GRID_LEFT + (minutes / 1440) * GRID_WIDTH;
}

function laneToY(lane: number): number {
  return GRID_TOP + lane * LANE_HEIGHT + LANE_HEIGHT / 2;
}

function buildStepLine(events: LogEvent[]): string {
  if (events.length === 0) return "";

  const points: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const lane = STATUS_TO_LANE[event.status] ?? 0;
    const startMin = timeStringToMinutes(event.start);
    let endMin = timeStringToMinutes(event.end);
    if (endMin === 0 && startMin > 0) endMin = 1440;

    const startX = minutesToX(startMin);
    const endX = minutesToX(endMin);
    const y = laneToY(lane);

    if (i === 0 && points.length === 0) {
      points.push({ x: startX, y });
    } else if (points.length > 0) {
      const lastPoint = points[points.length - 1];
      if (Math.abs(lastPoint.y - y) > 1) {
        points.push({ x: startX, y: lastPoint.y });
        points.push({ x: startX, y });
      }
    }

    points.push({ x: endX, y });
  }

  return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
}

function getRemarks(events: LogEvent[]): Array<{ x: number; text: string; level: number }> {
  const remarks: Array<{ x: number; text: string; level: number }> = [];

  for (const event of events) {
    if (!event.location && !event.note) continue;

    const startMin = timeStringToMinutes(event.start);
    const x = minutesToX(startMin);

    let text = "";
    if (event.location && event.note) {
      text = `${event.location} — ${event.note}`;
    } else if (event.location) {
      text = event.location;
    } else if (event.note) {
      text = event.note;
    }

    if (text) {
      let level = 0;
      for (let i = remarks.length - 1; i >= 0; i--) {
        if (Math.abs(remarks[i].x - x) < 30) {
          level = remarks[i].level + 1;
          break;
        }
      }
      remarks.push({ x, text, level });
    }
  }

  return remarks;
}

export default function ELDLogSheet({ log }: ELDLogSheetProps) {
  const stepLinePath = buildStepLine(log.events);
  const remarks = getRemarks(log.events);
  const remarksHeight = remarks.length > 0 ? 100 : 20;
  const svgHeight = REMARKS_TOP + remarksHeight + 10;

  const drivingPlusOnDuty = (log.totals.driving + log.totals.on_duty).toFixed(1);

  return (
    <Card sx={{ p: 0, overflow: "hidden" }}>
      <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid #DFE1E6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Box component="span" sx={{ fontWeight: 700, color: "#172B4D", fontSize: "0.95rem", fontFamily: "Inter, sans-serif" }}>
            {log.date_label}
          </Box>
          <Box component="span" sx={{ ml: 2, color: "#5E6C84", fontSize: "0.8rem", fontFamily: "Inter, sans-serif" }}>
            {log.total_miles} miles driven
          </Box>
        </Box>
      </Box>
      <Box sx={{ width: "100%", overflowX: "auto", backgroundColor: "#FFFFFF", p: 1.5 }}>
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${svgHeight}`}
          width="100%"
          style={{ minWidth: 800 }}
        >
          <rect x={0} y={0} width={SVG_WIDTH} height={svgHeight} fill="#FFFFFF" />

          <rect
            x={GRID_LEFT}
            y={GRID_TOP}
            width={GRID_WIDTH}
            height={GRID_HEIGHT}
            fill="#FAFBFC"
            stroke="#DFE1E6"
            strokeWidth={1}
          />

          {LANE_LABELS.map((label, i) => (
            <g key={label}>
              <text
                x={GRID_LEFT - 8}
                y={laneToY(i) + 4}
                fill={LANE_COLORS[i]}
                fontSize={9.5}
                fontFamily="Inter, sans-serif"
                fontWeight={600}
                textAnchor="end"
              >
                {label}
              </text>

              <rect
                x={GRID_LEFT}
                y={GRID_TOP + i * LANE_HEIGHT}
                width={GRID_WIDTH}
                height={LANE_HEIGHT}
                fill={i % 2 === 0 ? "transparent" : "rgba(0,0,0,0.015)"}
              />

              {i > 0 && (
                <line
                  x1={GRID_LEFT}
                  y1={GRID_TOP + i * LANE_HEIGHT}
                  x2={GRID_LEFT + GRID_WIDTH}
                  y2={GRID_TOP + i * LANE_HEIGHT}
                  stroke="#DFE1E6"
                  strokeWidth={0.5}
                />
              )}
            </g>
          ))}

          {Array.from({ length: 25 }, (_, i) => {
            const x = GRID_LEFT + i * HOUR_WIDTH;
            const isMajor = i === 0 || i === 6 || i === 12 || i === 18 || i === 24;
            return (
              <g key={`hour-${i}`}>
                <line
                  x1={x}
                  y1={GRID_TOP}
                  x2={x}
                  y2={GRID_TOP + GRID_HEIGHT}
                  stroke={isMajor ? "#C1C7D0" : "#EBECF0"}
                  strokeWidth={isMajor ? 1 : 0.5}
                />
                {i < 24 && (
                  <text
                    x={x + HOUR_WIDTH / 2}
                    y={GRID_TOP - 6}
                    fill="#5E6C84"
                    fontSize={8.5}
                    fontFamily="Inter, sans-serif"
                    fontWeight={isMajor ? 600 : 400}
                    textAnchor="middle"
                  >
                    {i === 0 ? "MN" : i === 12 ? "Noon" : i > 12 ? `${i - 12}P` : `${i}A`}
                  </text>
                )}
                {i < 24 &&
                  [1, 2, 3].map((q) => {
                    const qx = x + q * (HOUR_WIDTH / 4);
                    return (
                      <line
                        key={`q-${i}-${q}`}
                        x1={qx}
                        y1={GRID_TOP}
                        x2={qx}
                        y2={GRID_TOP + (q === 2 ? 8 : 4)}
                        stroke="#C1C7D0"
                        strokeWidth={0.5}
                      />
                    );
                  })}
              </g>
            );
          })}

          {log.events.map((event, i) => {
            const lane = STATUS_TO_LANE[event.status] ?? 0;
            const startMin = timeStringToMinutes(event.start);
            let endMin = timeStringToMinutes(event.end);
            if (endMin === 0 && startMin > 0) endMin = 1440;
            const x1 = minutesToX(startMin);
            const x2 = minutesToX(endMin);
            const y = GRID_TOP + lane * LANE_HEIGHT;
            const width = x2 - x1;

            if (width <= 0) return null;

            return (
              <rect
                key={`bg-${i}`}
                x={x1}
                y={y + 1}
                width={width}
                height={LANE_HEIGHT - 2}
                fill={LANE_BG[lane]}
                rx={1}
              />
            );
          })}

          <path
            d={stepLinePath}
            fill="none"
            stroke="#0052CC"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {log.events
            .filter((e) => e.location || e.note)
            .map((event, i) => {
              const startMin = timeStringToMinutes(event.start);
              const x = minutesToX(startMin);
              const lane = STATUS_TO_LANE[event.status] ?? 0;
              const y = laneToY(lane);

              return (
                <circle
                  key={`dot-${i}`}
                  cx={x}
                  cy={y}
                  r={3}
                  fill="#0052CC"
                  stroke="#FFFFFF"
                  strokeWidth={1.5}
                />
              );
            })}

          <rect
            x={TOTALS_LEFT}
            y={GRID_TOP}
            width={140}
            height={GRID_HEIGHT}
            fill="#FAFBFC"
            stroke="#DFE1E6"
            strokeWidth={1}
            rx={4}
          />
          <text x={TOTALS_LEFT + 70} y={GRID_TOP + 18} fill="#172B4D" fontSize={10} fontWeight={700} fontFamily="Inter, sans-serif" textAnchor="middle">
            HOURS
          </text>
          <line x1={TOTALS_LEFT + 10} y1={GRID_TOP + 26} x2={TOTALS_LEFT + 130} y2={GRID_TOP + 26} stroke="#DFE1E6" strokeWidth={0.5} />

          {LANE_LABELS.map((label, i) => {
            const totalsKey = ["off_duty", "sleeper_berth", "driving", "on_duty"][i] as keyof typeof log.totals;
            const value = log.totals[totalsKey];
            const y = GRID_TOP + 46 + i * 32;

            return (
              <g key={`total-${i}`}>
                <text x={TOTALS_LEFT + 10} y={y} fill={LANE_COLORS[i]} fontSize={9} fontFamily="Inter, sans-serif" fontWeight={500}>
                  {label}
                </text>
                <text x={TOTALS_LEFT + 130} y={y} fill="#172B4D" fontSize={12} fontFamily="Inter, sans-serif" fontWeight={700} textAnchor="end">
                  {value.toFixed(1)}
                </text>
              </g>
            );
          })}

          <circle cx={TOTALS_LEFT + 70} cy={GRID_TOP + GRID_HEIGHT - 20} r={16} fill="none" stroke="#0052CC" strokeWidth={2} />
          <text x={TOTALS_LEFT + 70} y={GRID_TOP + GRID_HEIGHT - 16} fill="#0052CC" fontSize={12} fontWeight={700} fontFamily="Inter, sans-serif" textAnchor="middle">
            {drivingPlusOnDuty}
          </text>

          {remarks.map((remark, i) => {
            const yOffset = remark.level * 20;
            return (
              <g key={`remark-${i}`} transform={`translate(${remark.x}, ${REMARKS_TOP + 5})`}>
                <line x1={0} y1={-5} x2={0} y2={5 + yOffset} stroke="#C1C7D0" strokeWidth={0.5} />
                <g transform={`translate(0, ${yOffset}) rotate(-35)`}>
                  <text
                    x={5}
                    y={0}
                    fill="#5E6C84"
                    fontSize={7.5}
                    fontFamily="Inter, sans-serif"
                  >
                    {remark.text.length > 40 ? remark.text.substring(0, 40) + "..." : remark.text}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </Box>
    </Card>
  );
}
