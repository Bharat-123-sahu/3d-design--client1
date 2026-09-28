// Dynamically load all SVGs in the stickers folder.
// Vite resolves the ?url query to the deployed asset path.
const modules = import.meta.glob("/public/assets/stickers/*.svg", {
  query: "?url",
  import: "default",
  eager: true,
});

const entries = Object.entries(modules).map(([path, url]) => {
  const id = path.split("/").pop().replace(".svg", "");
  // Clean up ID into a readable label if it doesn't match a known basic label.
  const label = id
    .replace(/^\d+_/, "")
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // Fallback for known nice labels
  const niceLabels = {
    star: "Orbit star",
    heart: "Open heart",
    sparkle: "Starlight",
    smile: "Good mood",
    lightning: "Lightning",
    rocket: "Launch",
    diamond: "Diamond",
    crown: "Crown",
    flower: "Bloom",
    planet: "Ringed planet",
    fire: "Creative fire",
    paw: "Paw",
    game: "Play",
    arrow: "Onward",
    spark: "Creative spark",
    code: "Code",
    chart: "Growth",
    gear: "Build",
    cloud: "Cloud",
    database: "Data",
  };

  return [id, { id, label: niceLabels[id] || label, src: url }];
});

export const stickerLibrary = Object.fromEntries(entries);

const allIds = Object.keys(stickerLibrary);

// Group all discovered IDs across categories so no asset is left behind.
export const stickerCategories = {
  home: [
    ...new Set([
      "star",
      "heart",
      "sparkle",
      "planet",
      "flower",
      "smile",
      ...allIds,
    ]),
  ],
  work: [
    ...new Set([
      "code",
      "rocket",
      "fire",
      "lightning",
      "chart",
      "arrow",
      ...allIds,
    ]),
  ],
  services: [
    ...new Set([
      "gear",
      "cloud",
      "database",
      "code",
      "diamond",
      "lightning",
      ...allIds,
    ]),
  ],
  about: [
    ...new Set(["heart", "smile", "flower", "paw", "game", "crown", ...allIds]),
  ],
  experience: [
    ...new Set([
      "rocket",
      "chart",
      "crown",
      "star",
      "arrow",
      "spark",
      ...allIds,
    ]),
  ],
  contact: [
    ...new Set([
      "heart",
      "planet",
      "sparkle",
      "smile",
      "rocket",
      "flower",
      ...allIds,
    ]),
  ],
};
