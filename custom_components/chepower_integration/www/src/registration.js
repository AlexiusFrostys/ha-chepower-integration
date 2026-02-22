export const registerCustomCard = () => {
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "chepower-card",
    name: "ChePower Schedule Card",
    description: "Information about power outage",
    preview: true,
  });
  console.info("%c CHEPOWER %c v1.0.0  - Loaded", "color: white; background: #03a9f4;", "color: #03a9f4;");
};