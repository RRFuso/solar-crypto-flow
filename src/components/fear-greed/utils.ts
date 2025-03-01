
export const getClassification = (value: number): string => {
  if (value <= 20) return "Medo Extremo";
  if (value <= 40) return "Medo";
  if (value <= 60) return "Neutro";
  if (value <= 80) return "Ganância";
  return "Ganância Extrema";
};

export const getColors = (value: number): string[] => {
  if (value <= 20) return ["#ff0000", "#ff3333"];
  if (value <= 40) return ["#ff6600", "#ff8533"];
  if (value <= 60) return ["#ffcc00", "#ffd633"];
  if (value <= 80) return ["#00cc00", "#00e600"];
  return ["#009900", "#00b300"];
};

export const getMessage = (value: number): string => {
  if (value <= 20) return "Considere uma compra ou DCA (Dollar Cost Averaging).";
  if (value >= 80) return "Considere uma realização de ganhos!";
  return "";
};

export const getMessageColor = (value: number): string => {
  if (value <= 20) return "text-red-500";
  if (value >= 80) return "text-green-500";
  return "text-gray-400";
};

export const getDominanceColor = (value: number): string => {
  if (value < 40) return "bg-red-500";
  if (value < 50) return "bg-orange-500";
  return "bg-green-500";
};

export const getDominanceText = (value: number): string => {
  if (value < 40) return "Baixa Dominância";
  if (value < 50) return "Dominância Equilibrada";
  return "Alta Dominância";
};
