// Content and tuning shared by the companion, feedback, and Home reveal.
export const characterConfig = {
  arrivalFade: 0.8,
  name: "Pip",
  travel: { min: 1.35, max: 5.6, turn: 0.3, settle: 0.35, walkSpeed: 1.85, runSpeed: 2.65, runDistance: 5.8, runThreshold: 2.1, turnResponse: 12 },
  visualScale: { desktop: 0.7, tablet: 0.76, mobile: 0.64, tabletMax: 1024, mobileMax: 600 },
  waiting: { position: [0, -1.6, 0], camera: [0, 1.2, 6.8], lookAt: [0, -0.5, 0], rotation: 0 },
  poseBlend: 9,
  navDuration: 0.24,
  studio: { seatHeight: 0.36, deskHeight: 0.68 },
  view: { desktop: 168, mobile: 112, breakpoint: 600, dpr: 1.5 },
};

export const feedbackContent = {
  title: "How was your experience?",
  description: "A little curiosity makes better work. Pip is listening.",
  options: [
    { value: "loved", label: "Loved it", symbol: "♡", reaction: "celebrate", reply: "That made Pip’s day." },
    { value: "good", label: "Good", symbol: "↗", reaction: "wave", reply: "A little wave of appreciation." },
    { value: "okay", label: "Okay", symbol: "○", reaction: "thinking", reply: "Room to grow. What would make it better?" },
    { value: "improve", label: "Needs improvement", symbol: "✳", reaction: "curious", reply: "Pip is all ears. What could feel better?" },
  ],
};

export const videoRevealConfig = {
  // Supply an owned video source and optional WebVTT captions here.
  src: "",
  captions: "",
  title: "A little perspective.",
  label: "In motion",
  poster: "/assets/images/hero/hero-banner.jpg",
  desktop: { rise: 150, rotation: -6 },
  mobile: { rise: 64, rotation: -2 },
};
