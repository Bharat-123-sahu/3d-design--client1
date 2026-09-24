const pad = (n) => String(n + 1).padStart(2, "0");
const card = (p, i, extra = "") => `<article class="cinema-card ${extra}" style="--project-color:${p.color}">
  <img src="${p.image}" alt="" loading="eager" width="480" height="300">
  <div class="cinema-card__body"><span>${pad(i)} / ${p.categoryLabel}</span><h3>${p.title}</h3><p>${p.description}</p></div>
</article>`;
const shell = (kind, number, title, body) => `<section class="work-cinema work-cinema--${kind}" id="work-${kind}" aria-labelledby="${kind}-title" data-cinematic="${kind}">
  <div class="work-cinema__inner"><header class="work-cinema__header"><p>${number} / SELECTED WORK</p><h2 id="${kind}-title">${title}</h2><a href="#work-grid">Explore all projects &nearr;</a></header>
  ${body}<div class="work-cinema__footer"><span>SCROLL TO EXPLORE</span><div class="work-cinema__progress"><i></i></div><span>ANKIT JAIN / PORTFOLIO</span></div></div>
</section>`;
export function workCinematics(projects) {
  const directions = ["N", "NE", "SE", "S", "SW", "NW"];
  const faces = ["front", "right", "back", "left", "top", "bottom"];
  return shell("radial", "01", "Every direction. A possibility.", `<div class="radial-stage"><div class="compass" aria-hidden="true"><span>N</span><span>E</span><span>S</span><span>W</span><b>IDEAS<br>IN ORBIT</b></div>${projects.map((p,i) => `<div class="radial-node" data-direction="${directions[i]}">${card(p,i)}</div>`).join("")}</div>`)
  + shell("dice", "02", "A different perspective.", `<div class="dice-stage"><div class="dice-camera"><div class="project-dice">${projects.map((p,i) => card(p,i,`dice-face dice-face--${faces[i]}`)).join("")}</div></div><div class="dice-captions">${projects.map((p,i) => `<div class="dice-caption"><span>${pad(i)} / ${p.categoryLabel}</span><h3>${p.title}</h3><p>${p.description}</p></div>`).join("")}</div></div>`)
  + shell("bird", "03", "Ideas find their place.", `<div class="bird-stage"><svg class="story-tree" viewBox="0 0 1000 500" preserveAspectRatio="none" aria-hidden="true"><path d="M510 500 Q500 350 550 160 M520 360 Q350 310 200 220 M525 310 Q700 260 810 160 M535 260 Q380 180 290 120 M545 220 Q665 155 700 80 M510 425 Q365 395 160 330 M515 390 Q670 360 850 300"/><g>${[[200,220],[810,160],[290,120],[700,80],[160,330],[850,300]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="7"/>`).join("")}</g></svg><div class="story-bird" aria-hidden="true"><svg viewBox="0 0 80 50"><path d="M12 32 Q30 14 53 25 Q58 12 67 20 L78 24 L66 28 Q52 46 27 35 L5 41 Z"/><path class="bird-wing" d="M42 29 Q25 4 12 5 Q15 26 42 29Z"/></svg></div><div class="bird-cards">${projects.map((p,i)=>card(p,i)).join("")}</div></div>`);
}
