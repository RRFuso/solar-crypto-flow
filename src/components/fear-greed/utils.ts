
export const getClassification = (value: number): string => {
  if (value <= 20) return "Medo Extremo";
  if (value <= 40) return "Medo";
  if (value <= 60) return "Neutro";
  if (value <= 80) return "Ganância";
  return "Ganância Extrema";
};

export const getColors = (value: number): string[] => {
  if (value <= 20) return ["#ff0000", "#ff3333"]; // Red LED
  if (value <= 40) return ["#ff6600", "#ff8533"]; // Orange LED
  if (value <= 60) return ["#ffcc00", "#ffd633"]; // Yellow LED
  if (value <= 80) return ["#33cc33", "#66ff66"]; // Green LED
  return ["#00cc00", "#00ff00"]; // Bright Green LED
};

export const getMessage = (value: number): string => {
  if (value <= 20) return "Considere uma compra ou DCA (Dollar Cost Averaging).";
  if (value >= 80) return "Considere uma realização de ganhos!";
  return "";
};

export const getMessageColor = (value: number): string => {
  if (value <= 20) return "text-red-500 animate-pulse";
  if (value >= 80) return "text-green-500 animate-pulse";
  return "text-gray-400";
};

export const getDominanceColor = (value: number): string => {
  if (value < 40) return "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.7)]";
  if (value < 50) return "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.7)]";
  return "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.7)]";
};

export const getDominanceText = (value: number): string => {
  if (value < 40) return "Baixa Dominância";
  if (value < 50) return "Dominância Equilibrada";
  return "Alta Dominância";
};
