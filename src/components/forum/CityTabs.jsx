import React from "react";
import { useSearchParams } from "react-router-dom";

const CITIES = [
  { label: "全部", value: "" },
  { label: "新山", value: "新山" },
  { label: "常规", value: "常规" },
  { label: "吉隆坡", value: "吉隆坡" },
  { label: "新加坡", value: "新加坡" },
  { label: "槟城", value: "槟城" },
  { label: "马六甲", value: "马六甲" },
  { label: "东马", value: "东马" },
  { label: "森美兰", value: "森美兰" },
  { label: "云顶", value: "云顶" },
];

export default function CityTabs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCity = searchParams.get("city") || "";

  const handleCity = (value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("city", value);
    } else {
      params.delete("city");
    }
    setSearchParams(params);
  };

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
      {CITIES.map((city) => (
        <button
          key={city.value}
          onClick={() => handleCity(city.value)}
          className={`shrink-0 px-4 py-2 text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
            activeCity === city.value
              ? "bg-primary text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          {city.label}
        </button>
      ))}
    </div>
  );
}