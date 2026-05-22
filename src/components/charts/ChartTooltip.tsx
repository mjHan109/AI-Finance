"use client";

export const tooltipContentStyle = {
  background: "#0f0d13",
  border: "1px solid rgba(139,92,246,0.25)",
  borderRadius: "8px",
  fontSize: "12px",
  color: "#ffffff",
  padding: "8px 12px",
  boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
};

export const tooltipLabelStyle = {
  color: "#a78bfa",
  marginBottom: 4,
  fontWeight: 500 as const,
};

/** Pass to Recharts Tooltip cursor prop to disable the gray hover overlay */
export const tooltipCursor = false as const;
