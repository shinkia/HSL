import React from "react";

export default function HoneypotField({ value, onChange, name = "website_url" }) {
  return (
    <div
      style={{
        position: "absolute",
        left: "-9999px",
        top: "-9999px",
        width: "1px",
        height: "1px",
        overflow: "hidden",
      }}
      aria-hidden="true"
    >
      <label htmlFor={name}>Website (leave empty)</label>
      <input
        type="text"
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        tabIndex={-1}
        autoComplete="off"
      />
    </div>
  );
}