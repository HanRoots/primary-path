const data = window.PATH_DATA;
let activeLevel = 1;
let activeStrand = "all";
let query = "";

const heroStats = document.querySelector("#heroStats");
const levelMap = document.querySelector("#levelMap");
const levelTabs = document.querySelector("#levelTabs");
const strandTabs = document.querySelector("#strandTabs");
const activeSummary = document.querySelector("#activeSummary");
const unitGrid = document.querySelector("#unitGrid");
const resultsMeta = document.querySelector("#resultsMeta");
const searchInput = document.querySelector("#searchInput");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function levelByNumber(levelNumber) {
  return data.levels.find((level) => level.level === Number(levelNumber));
}

function flattenValues(value) {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value.flatMap(flattenValues);
  if (typeof value === "object") return Object.values(value).flatMap(flattenValues);
  return [String(value)];
}

function unitMatches(unit, level) {
  if (!query) return true;
  const strandValues =
    activeStrand === "all"
      ? [unit.grammar, unit.speaking, unit.writing]
      : [unit[activeStrand]];
  const haystack = [
    level.level,
    level.name,
    level.zhName,
    unit.unitLabel,
    unit.bigQuestion,
    ...strandValues.flatMap(flattenValues),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function renderStats() {
  const stats = [
    { value: data.stats.levelCount, label: "Levels 分级" },
    { value: data.stats.unitCount, label: "Units 单元" },
    { value: data.stats.strandCount, label: "Strands 能力线" },
  ];

  heroStats.innerHTML = stats
    .map(
      (stat) => `
        <div class="stat">
          <strong>${escapeHtml(stat.value)}</strong>
          <span>${escapeHtml(stat.label)}</span>
        </div>
      `,
    )
    .join("");
}

function renderLevelMap() {
  levelMap.innerHTML = data.levels
    .map(
      (level) => `
        <article class="level-card" style="--accent: ${level.accent}">
          <div class="level-number">Level ${level.level}</div>
          <h3>${escapeHtml(level.name)}<br />${escapeHtml(level.zhName)}</h3>
          <p>${escapeHtml(level.summary)}</p>
          <div class="focus-list">
            ${level.focus.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
          </div>
        </article>
      `,
    )
    .join("");
}

function renderLevelTabs() {
  const tabs = [
    { label: "全部", value: "all" },
    ...data.levels.map((level) => ({ label: `Level ${level.level}`, value: level.level })),
  ];

  levelTabs.innerHTML = tabs
    .map(
      (tab) => `
        <button class="tab" type="button" data-level="${tab.value}" aria-pressed="${String(
          activeLevel === tab.value,
        )}">
          ${escapeHtml(tab.label)}
        </button>
      `,
    )
    .join("");

  levelTabs.querySelectorAll(".tab").forEach((button) => {
    button.addEventListener("click", () => {
      const selected = button.dataset.level;
      activeLevel = selected === "all" ? "all" : Number(selected);
      renderExplorer();
    });
  });
}

function renderStrandTabs() {
  const tabs = [
    { label: "总览", value: "all" },
    { label: "Grammar", value: "grammar" },
    { label: "Oracy", value: "speaking" },
    { label: "Writing", value: "writing" },
  ];

  strandTabs.innerHTML = tabs
    .map(
      (tab) => `
        <button class="tab strand-tab" type="button" data-strand="${tab.value}" aria-pressed="${String(
          activeStrand === tab.value,
        )}">
          ${escapeHtml(tab.label)}
        </button>
      `,
    )
    .join("");

  strandTabs.querySelectorAll(".tab").forEach((button) => {
    button.addEventListener("click", () => {
      activeStrand = button.dataset.strand;
      renderExplorer();
    });
  });
}

function renderSummary(levelsForView) {
  const strand = data.strands[activeStrand];
  if (activeLevel === "all") {
    const tags =
      activeStrand === "all"
        ? ["Grammar", "Oracy", "Writing", `${data.stats.learningNodes} Learning Nodes`]
        : [strand.enLabel, strand.label, `${data.stats.unitCount} Units`];
    activeSummary.style.setProperty("--accent", "var(--teal)");
    activeSummary.innerHTML = `
      <div>
        <h3 class="summary-title"><span>All Levels</span> · ${escapeHtml(strand.label)}</h3>
        <p>${escapeHtml(strand.summary)}完整呈现 ${data.stats.levelCount} 个 Level、${data.stats.unitCount} 个 Unit、${data.stats.learningNodes} 个学习节点。</p>
      </div>
      <div class="summary-tags">
        ${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
      </div>
    `;
    return;
  }

  const level = levelsForView[0];
  activeSummary.style.setProperty("--accent", level.accent);
  activeSummary.innerHTML = `
    <div>
      <h3 class="summary-title"><span>Level ${level.level}</span> · ${escapeHtml(level.name)} / ${escapeHtml(level.zhName)}</h3>
      <p>${escapeHtml(level.summary)} ${escapeHtml(strand.summary)}</p>
    </div>
    <div class="summary-tags">
      ${[strand.enLabel, ...level.focus].map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
    </div>
  `;
}

function currentLevels() {
  return activeLevel === "all" ? data.levels : [levelByNumber(activeLevel)];
}

function renderUnits(levelsForView) {
  const cards = [];

  levelsForView.forEach((level) => {
    level.units.filter((unit) => unitMatches(unit, level)).forEach((unit) => {
      cards.push({ level, unit });
    });
  });

  resultsMeta.textContent = `${cards.length} 个单元匹配当前条件`;

  if (!cards.length) {
    unitGrid.innerHTML = `<div class="empty-state">没有找到匹配的单元。</div>`;
    return;
  }

  unitGrid.innerHTML = cards
    .map(
      ({ level, unit }) => `
        <article class="unit-card" style="--accent: ${level.accent}">
          <div class="unit-meta">
            <span class="unit-badge">Level ${level.level}</span>
            <span class="unit-number">Unit ${unit.unit}</span>
          </div>
          <h3>${escapeHtml(unit.bigQuestion)}</h3>
          ${renderUnitContent(unit)}
        </article>
      `,
    )
    .join("");
}

function renderInfoBlock(label, value) {
  return `
    <div class="info-block">
      <strong>${escapeHtml(label)}</strong>
      <p>${escapeHtml(value || "—")}</p>
    </div>
  `;
}

function renderSystemLine(label, value, className) {
  return `
    <div class="system-line ${className}">
      <strong>${escapeHtml(label)}</strong>
      <p>${escapeHtml(value || "—")}</p>
    </div>
  `;
}

function renderUnitContent(unit) {
  if (activeStrand === "grammar") {
    return [
      renderInfoBlock("Grammar Focus", unit.grammar.focus),
      renderInfoBlock("Examples", unit.grammar.examples),
      renderInfoBlock("Vocabulary / Context", unit.grammar.themes),
      renderInfoBlock("Difficulty", unit.grammar.difficulty),
    ].join("");
  }

  if (activeStrand === "speaking") {
    return [
      renderInfoBlock("Speaking Skill", unit.speaking.skill),
      renderInfoBlock("Prompt Cards / Expressions", unit.speaking.expressions),
      renderInfoBlock("Tasks & Activities", unit.speaking.task),
    ].join("");
  }

  if (activeStrand === "writing") {
    return [
      renderInfoBlock("Core Writing Task", unit.writing.task),
      renderInfoBlock("Improve Your Writing", unit.writing.craft),
      renderInfoBlock("Writing Practice", unit.writing.practice),
      renderInfoBlock("Text Type / Genre", unit.writing.genre),
    ].join("");
  }

  return `
    <div class="system-lines">
      ${renderSystemLine("Grammar", unit.grammar.focus, "grammar-line")}
      ${renderSystemLine("Oracy", unit.speaking.skill, "speaking-line")}
      ${renderSystemLine("Writing", unit.writing.task, "writing-line")}
    </div>
  `;
}

function renderExplorer() {
  const levelsForView = currentLevels().filter(Boolean);
  renderStrandTabs();
  renderLevelTabs();
  renderSummary(levelsForView);
  renderUnits(levelsForView);
}

searchInput.addEventListener("input", (event) => {
  query = event.target.value.trim();
  renderExplorer();
});

renderStats();
renderLevelMap();
renderExplorer();
