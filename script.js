const DEFAULT_STAGE_CONFIGS = [
  {
    id: "neo",
    name: "NEO STAGE",
    shortName: "NEO",
    venue: "OUTDOOR",
    color: "#c9ff2f",
    viewers: 12458,
    contentMode: "premiere",
    videoTitle: "DAY 1",
    videoId: "Y00aijSgbo4",
    youtubeUrl: "https://youtu.be/Y00aijSgbo4?si=5L1h0oQDcDNLDPPk",
    timeline: [
      { start: "19:00", end: "19:05", title: "オープニング" },
      { start: "19:05", end: "20:00", title: "1-13 and mora..." },
      { start: "20:00", end: "20:05", title: "14 Baumkuchen-Man" },
      { start: "20:05", end: "21:00", title: "14-28 and mora..." },
      { start: "21:00", end: "21:05", title: "29 Jayz" },
      { start: "21:05", end: "21:30", title: "30-35 and mora..." },
    ],
  },
  {
    id: "void",
    name: "VOID STAGE",
    shortName: "VOID",
    venue: "INDOOR",
    color: "#ff4d9e",
    viewers: 23084,
    contentMode: "premiere",
    videoTitle: "DAY 2",
    videoId: "4ZcmQB-O_rA",
    youtubeUrl: "https://www.youtube.com/watch?v=4ZcmQB-O_rA",
    timeline: [
      { start: "19:00", end: "19:05", title: "オープニング" },
      { start: "19:05", end: "20:00", title: "1-13 and mora..." },
      { start: "20:00", end: "20:05", title: "14 ∫varts" },
      { start: "20:05", end: "21:00", title: "14-26 and mora..." },
      { start: "21:00", end: "21:05", title: "27 Pink Shih Tzu (AI CREATOR PONTA)" },
      { start: "21:05", end: "21:45", title: "28-35 and mora..." },
      { start: "21:45", end: "21:50", title: "フィナーレ＆エンディング" },
    ],
  },
  {
    id: "echo",
    name: "ECHO STAGE",
    shortName: "ECHO",
    venue: "WAREHOUSE",
    color: "#27d3ff",
    viewers: 9780,
    contentMode: "video",
    videoTitle: 'Live "SAIHATE"',
    videoId: "XQfk5PReT-c",
    youtubeUrl: "https://youtu.be/XQfk5PReT-c",
    timeline: [
      { start: "09:30", end: "10:00", title: "FADE IN/OUT" },
      { start: "10:00", end: "10:30", title: "LOST SIGNAL" },
      { start: "10:30", end: "11:00", title: "BEYOND THE ECHO" },
      { start: "11:00", end: "11:30", title: "STATIC PULSE" },
    ],
  },
];

let stageConfigs = DEFAULT_STAGE_CONFIGS.map(cloneStageConfig);

const CONFIG_ENDPOINTS = ["/api/stage-config", "/stage-config.local.json"];
const AUDIENCE_ENDPOINT = "/api/youtube-metrics";

const state = {
  selectedStageId: "void",
  selectedProgramId: null,
  schedule: [],
  startTime: null,
  endTime: null,
  audienceMetrics: {},
};

const elements = {
  player: document.getElementById("stagePlayer"),
  liveBadge: document.getElementById("liveBadge"),
  playerStageName: document.getElementById("playerStageName"),
  playerProgramLabel: document.getElementById("playerProgramLabel"),
  playerProgramTitle: document.getElementById("playerProgramTitle"),
  playerMetaTimeLabel: document.getElementById("playerMetaTimeLabel"),
  playerProgramTime: document.getElementById("playerProgramTime"),
  audienceCard: document.getElementById("audienceCard"),
  audienceLabel: document.getElementById("audienceLabel"),
  audienceValue: document.getElementById("audienceValue"),
  audienceHint: document.getElementById("audienceHint"),
  clockNow: document.getElementById("clockNow"),
  clockDate: document.getElementById("clockDate"),
  stageStatus: document.getElementById("stageStatus"),
  scheduleEyebrow: document.getElementById("scheduleEyebrow"),
  scheduleTitle: document.getElementById("scheduleTitle"),
  scheduleLegend: document.getElementById("scheduleLegend"),
  timetableFrame: document.getElementById("timetableFrame"),
  timeScaleWrap: document.getElementById("timeScaleWrap"),
  timeScale: document.getElementById("timeScale"),
  timelineClock: document.getElementById("timelineClock"),
  timetableRows: document.getElementById("timetableRows"),
  chatPanel: document.querySelector(".chat-panel"),
  chatStagePill: document.getElementById("chatStagePill"),
  youtubeChatFrame: document.getElementById("youtubeChatFrame"),
  youtubeChatHelp: document.getElementById("youtubeChatHelp"),
};

async function init() {
  await loadStageConfigs();

  state.selectedStageId = getSelectableStageById(state.selectedStageId)?.id
    ?? stageConfigs.find((stage) => !stage.isResting)?.id
    ?? stageConfigs[0]?.id
    ?? "void";
  state.schedule = buildSchedule();
  state.selectedProgramId = getDefaultProgramForStage(state.selectedStageId)?.id ?? state.schedule[0]?.id ?? null;

  renderTimeScale();
  renderTimetable();
  renderStatusRail();
  renderSelectedStage();
  await loadAudienceMetrics();
  bindMobileChatViewportBehavior();
  tick();
  setInterval(tick, 1000);
  setInterval(loadAudienceMetrics, 60000);
}

async function loadStageConfigs() {
  for (const endpoint of CONFIG_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const normalized = normalizeStageConfigs(data);
      if (normalized.length > 0) {
        stageConfigs = normalized;
        return;
      }
    } catch {
      // Fall through to the next source.
    }
  }

  stageConfigs = DEFAULT_STAGE_CONFIGS.map(cloneStageConfig);
}

function normalizeStageConfigs(data) {
  const source = Array.isArray(data?.stages)
    ? data.stages
    : data && typeof data === "object"
      ? Object.entries(data).map(([id, value]) => ({ id, ...value }))
      : [];

  return DEFAULT_STAGE_CONFIGS.map((defaultStage) => {
    const incoming = source.find((stage) => stage.id === defaultStage.id);
    if (!incoming) {
      return cloneStageConfig(defaultStage);
    }

    const youtubeUrl = typeof incoming.youtubeUrl === "string" ? incoming.youtubeUrl.trim() : "";
    const extractedVideoId = extractVideoId(youtubeUrl);
    const videoId = typeof incoming.videoId === "string" && incoming.videoId.trim()
      ? incoming.videoId.trim()
      : extractedVideoId ?? defaultStage.videoId;

    return {
      ...cloneStageConfig(defaultStage),
      isResting: incoming.isResting === true,
      contentMode: incoming.contentMode === "premiere" ? "premiere" : "video",
      videoTitle:
        typeof incoming.title === "string" && incoming.title.trim()
          ? incoming.title.trim()
          : typeof incoming.videoTitle === "string" && incoming.videoTitle.trim()
            ? incoming.videoTitle.trim()
            : defaultStage.videoTitle,
      youtubeUrl: youtubeUrl || `https://youtu.be/${videoId}`,
      videoId,
      viewers:
        typeof incoming.viewers === "number" && Number.isFinite(incoming.viewers)
          ? incoming.viewers
          : defaultStage.viewers,
      timeline: normalizeTimeline(incoming.timeline, defaultStage.timeline),
    };
  });
}

function normalizeTimeline(incomingTimeline, fallbackTimeline) {
  if (!Array.isArray(incomingTimeline)) {
    return fallbackTimeline.map((slot) => ({ ...slot }));
  }

  if (incomingTimeline.length === 0) {
    return [];
  }

  const normalized = incomingTimeline
    .map((slot) => ({
      start: normalizeTimeString(slot?.start),
      end: normalizeTimeString(slot?.end),
      title: typeof slot?.title === "string" ? slot.title.trim() : "",
      displayTime: normalizeDisplayTime(slot?.displayTime),
      seekSeconds: normalizeSeekSeconds(slot?.seekSeconds),
    }))
    .filter((slot) => slot.start && slot.end && slot.title);

  return normalized.length > 0 ? normalized : fallbackTimeline.map((slot) => ({ ...slot }));
}

function normalizeSeekSeconds(value) {
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds >= 0 ? Math.floor(seconds) : null;
}

function normalizeDisplayTime(value) {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, 40)
    : "";
}

function normalizeTimeString(value) {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  return /^\d{2}:\d{2}$/.test(trimmed) ? trimmed : "";
}

function cloneStageConfig(stage) {
  return {
    ...stage,
    timeline: stage.timeline.map((slot) => ({ ...slot })),
  };
}

function extractVideoId(urlOrId) {
  if (typeof urlOrId !== "string") {
    return null;
  }

  const input = urlOrId.trim();
  if (!input) {
    return null;
  }

  if (/^[\w-]{11}$/.test(input)) {
    return input;
  }

  try {
    const url = new URL(input);
    if (url.hostname.includes("youtu.be")) {
      return url.pathname.replace(/^\/+/, "").slice(0, 11) || null;
    }

    if (url.hostname.includes("youtube.com")) {
      return url.searchParams.get("v")?.slice(0, 11) ?? null;
    }
  } catch {
    return null;
  }

  return null;
}

function buildSchedule() {
  const baseDate = new Date();
  baseDate.setSeconds(0, 0);

  const activeStages = stageConfigs.filter((stage) => !stage.isResting);
  const timelinePrograms = activeStages.flatMap((stage) => createTimelinePrograms(stage, baseDate));

  if (timelinePrograms.length > 0) {
    const earliestStart = timelinePrograms.reduce(
      (earliest, program) => (program.start < earliest ? program.start : earliest),
      timelinePrograms[0].start,
    );
    const latestEnd = timelinePrograms.reduce(
      (latest, program) => (program.end > latest ? program.end : latest),
      timelinePrograms[0].end,
    );
    state.startTime = new Date(earliestStart);
    state.endTime = new Date(latestEnd);
  } else {
    const rounded = new Date(baseDate);
    rounded.setMinutes(Math.floor(baseDate.getMinutes() / 15) * 15, 0, 0);
    state.startTime = addMinutes(rounded, -45);
    state.endTime = addMinutes(state.startTime, 180);
  }

  return activeStages.flatMap((stage) =>
    hasTimeline(stage)
      ? createTimelinePrograms(stage, baseDate)
      : [
          {
            id: `${stage.id}-video`,
            stageId: stage.id,
            title: stage.videoTitle ?? stage.name,
            start: state.startTime,
            end: state.endTime,
            seekSeconds: 0,
          },
        ],
  );
}

function createTimelinePrograms(stage, baseDate) {
  if (!hasTimeline(stage)) {
    return [];
  }

  return stage.timeline.map((slot, index) => {
    const start = combineDateAndTime(baseDate, slot.start);
    const end = combineDateAndTime(baseDate, slot.end, start);
    return {
      id: `${stage.id}-${index}`,
      stageId: stage.id,
      title: slot.title,
      start,
      end,
      displayTime: slot.displayTime,
      seekSeconds: slot.seekSeconds,
    };
  });
}

function renderTimeScale() {
  const tickTimes = [];
  const totalMinutes = minutesBetween(state.startTime, state.endTime);

  for (let minutes = 0; minutes <= totalMinutes; minutes += 30) {
    tickTimes.push(addMinutes(state.startTime, minutes));
  }

  elements.timeScale.innerHTML = tickTimes
    .map((time) => `<div class="time-tick">${formatTime(time)}</div>`)
    .join("");
}

function renderTimetable() {
  elements.timetableRows.innerHTML = stageConfigs
    .map((stage) => {
      const programs = state.schedule.filter((program) => program.stageId === stage.id);
      return `
        <div class="timetable-row">
          <div class="stage-label" style="background:${stage.color}">
            <span>${stage.shortName}<br />STAGE</span>
            <small>${stage.venue}</small>
          </div>
          <div class="track ${stage.isResting ? "is-resting" : ""}" data-track-stage="${stage.id}">
            <div class="row-now-line"></div>
            ${programs.map((program) => renderProgramCard(program, stage.color)).join("")}
          </div>
        </div>
      `;
    })
    .join("");

  Array.from(document.querySelectorAll(".program-card")).forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedStageId = button.dataset.stageId;
      state.selectedProgramId = button.dataset.programId;
      renderSelectedStage({ autoplay: true });
      renderStatusRail();
      renderTimetable();
    });
  });

  updateTimelinePositions();
}

function renderProgramCard(program, color) {
  const stage = getStageById(program.stageId);
  const isPremiere = stage?.contentMode === "premiere";
  const hasTimedSlots = hasTimeline(stage);
  const isSelected = program.id === state.selectedProgramId;
  const isLive = isPremiere && isCurrent(program);
  const left = percentForTime(program.start);
  const width = percentWidth(program.start, program.end);
  const cardLeft = hasTimedSlots ? left : 0;
  const cardWidth = hasTimedSlots ? width : 100;
  const badgeText = isSelected ? "NOW PLAYING" : isPremiere && isLive ? "ON AIR" : "SELECT";

  return `
    <button
      class="program-card ${isSelected ? "is-selected" : ""} ${isLive ? "is-live" : ""}"
      type="button"
      data-program-id="${program.id}"
      data-stage-id="${program.stageId}"
      style="left:${cardLeft}%; width:${cardWidth}%; --card-color:${color}"
    >
      <div>
        ${hasTimedSlots ? `<div class="slot-time">${formatProgramTime(program)}</div>` : ""}
        <p class="slot-title">${program.title}</p>
      </div>
      <span class="slot-badge">${badgeText}</span>
    </button>
  `;
}

function renderStatusRail() {
  const stageStatuses = stageConfigs
    .map((stage) => {
      const liveProgram = getCurrentProgramForStage(stage.id);
      const selected = stage.id === state.selectedStageId;
      const statusText = stage.isResting
        ? "OFF AIR"
        : stage.contentMode === "premiere"
        ? (liveProgram ? "ON AIR" : "NEXT UP")
        : selected ? "NOW PLAYING" : "VIDEO";
      return `
        <div class="status-item ${selected ? "is-selected" : ""} ${stage.isResting ? "is-resting" : ""}">
          <div class="status-name" style="color:${stage.color}">${stage.name}</div>
          <div class="status-meta">
            <span class="status-light" style="color:${stage.color}; background:${stage.color}"></span>
            <span>${statusText}</span>
          </div>
        </div>
      `;
    })
    .join("");

  elements.stageStatus.innerHTML = stageStatuses;
}

function renderSelectedStage({ autoplay = false } = {}) {
  const stage = getSelectedStage();
  const program = getSelectedProgram();
  const isPremiere = stage?.contentMode === "premiere";
  const hasTimedSlots = hasTimeline(stage);
  if (!stage || !program) {
    return;
  }

  renderAudienceCard(stage);
  elements.liveBadge.style.borderColor = `${stage.color}88`;
  elements.liveBadge.style.background = `${stage.color}22`;
  elements.liveBadge.textContent = isPremiere ? (isCurrent(program) ? "ON AIR" : "STANDBY") : "NOW PLAYING";
  elements.playerStageName.textContent = stage.name;
  elements.playerProgramLabel.textContent = "CURRENT SLOT";
  elements.playerProgramTitle.textContent = program.title;
  elements.playerMetaTimeLabel.textContent = "TIME";
  elements.playerProgramTime.textContent = hasTimedSlots
    ? formatProgramTime(program)
    : "ON-DEMAND VIDEO";
  elements.chatStagePill.textContent = stage.name;
  const nextSrc = buildEmbedUrl(stage.videoId, program.seekSeconds, autoplay);
  if (elements.player.getAttribute("src") !== nextSrc) {
    elements.player.src = nextSrc;
  }
  syncScheduleModeUI(stage);
  updateYouTubeChat(stage.videoId);
}

async function loadAudienceMetrics() {
  try {
    const response = await fetch(AUDIENCE_ENDPOINT, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      return;
    }

    const data = await response.json();
    if (data?.metrics && typeof data.metrics === "object") {
      state.audienceMetrics = data.metrics;
      renderAudienceCard(getSelectedStage());
    }
  } catch {
    // Local static hosting and deployments without an API key keep the placeholder visible.
  }
}

function renderAudienceCard(stage) {
  if (!stage || !elements.audienceCard) {
    return;
  }

  const isPremiere = stage.contentMode === "premiere";
  const metric = state.audienceMetrics[stage.videoId];
  const count = isPremiere ? metric?.concurrentViewers : metric?.viewCount;

  elements.audienceCard.classList.toggle("is-live-audience", isPremiere);
  elements.audienceLabel.textContent = isPremiere ? "LIVE VIEWERS" : "TOTAL VIEWS";
  elements.audienceValue.textContent = formatAudienceCount(count);
  elements.audienceHint.textContent = count == null
    ? "YOUTUBE DATA"
    : isPremiere
      ? "WATCHING NOW"
      : "ON YOUTUBE";
}

function formatAudienceCount(value) {
  const count = Number(value);
  return Number.isFinite(count) && count >= 0
    ? new Intl.NumberFormat("ja-JP").format(Math.floor(count))
    : "—";
}

function formatProgramTime(program) {
  return program.displayTime || `${formatTime(program.start)} - ${formatTime(program.end)}`;
}

function syncScheduleModeUI(stage) {
  const isPremiere = stage?.contentMode === "premiere";
  const hasTimedSlots = hasTimeline(stage);
  elements.scheduleEyebrow.textContent = hasTimedSlots
    ? (isPremiere ? "CLICK TO SWITCH" : "SELECT A CHAPTER")
    : "PICK A VIDEO";
  elements.scheduleTitle.textContent = "TIMETABLE";
  elements.scheduleLegend.hidden = !isPremiere;
  elements.timeScaleWrap.hidden = !hasTimedSlots;
  elements.timetableFrame.classList.toggle("is-video-mode", !hasTimedSlots);
  elements.timetableFrame.classList.toggle("is-archive-mode", hasTimedSlots && !isPremiere);
}

function updateYouTubeChat(videoId) {
  const canEmbedChat = ["http:", "https:"].includes(window.location.protocol) && window.location.hostname;

  if (!canEmbedChat) {
    elements.youtubeChatFrame.removeAttribute("src");
    elements.youtubeChatHelp.textContent =
      "YouTube Chat is available only on http(s) hosts such as localhost or your deployed domain.";
    return;
  }

  const chatUrl = `https://www.youtube.com/live_chat?v=${videoId}&embed_domain=${window.location.hostname}`;
  elements.youtubeChatFrame.src = chatUrl;
  elements.youtubeChatHelp.textContent = "";
}

function bindMobileChatViewportBehavior() {
  if (!elements.youtubeChatFrame) {
    return;
  }

  let resetTimer = null;
  const mediaQuery = window.matchMedia("(max-width: 820px)");

  const setChatFocusMode = (enabled) => {
    document.body.classList.toggle("is-chat-focus", enabled && mediaQuery.matches);
  };

  const scheduleReset = () => {
    window.clearTimeout(resetTimer);
    resetTimer = window.setTimeout(() => {
      setChatFocusMode(false);
    }, 1200);
  };

  const activateChatFocusMode = () => {
    setChatFocusMode(true);
  };

  elements.youtubeChatFrame.addEventListener("focus", activateChatFocusMode);
  elements.youtubeChatFrame.addEventListener("touchstart", activateChatFocusMode, { passive: true });
  elements.youtubeChatFrame.addEventListener("pointerdown", activateChatFocusMode);

  document.addEventListener("pointerdown", (event) => {
    if (!mediaQuery.matches) {
      return;
    }

    if (!elements.youtubeChatFrame.contains(event.target) && !elements.chatPanel?.contains(event.target)) {
      setChatFocusMode(false);
    }
  });

  if (window.visualViewport) {
    const baseHeight = () => window.visualViewport.height;
    let lastExpandedHeight = baseHeight();

    window.visualViewport.addEventListener("resize", () => {
      if (!mediaQuery.matches) {
        setChatFocusMode(false);
        return;
      }

      const currentHeight = window.visualViewport.height;
      if (currentHeight < lastExpandedHeight - 100) {
        setChatFocusMode(true);
      } else {
        scheduleReset();
      }
      lastExpandedHeight = Math.max(lastExpandedHeight, currentHeight);
    });
  }

  window.addEventListener("orientationchange", () => {
    setChatFocusMode(false);
  });
}

function tick() {
  const now = new Date();
  elements.clockNow.textContent = formatTime(now);
  elements.clockDate.textContent = now.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
  elements.timelineClock.textContent = formatTime(now);

  if (isPremiereStage() && !isCurrent(getSelectedProgram())) {
    const currentForStage = getCurrentProgramForStage(state.selectedStageId);
    if (currentForStage) {
      state.selectedProgramId = currentForStage.id;
      renderSelectedStage();
      renderTimetable();
    }
  }

  updateTimelinePositions();
  renderStatusRail();
}

function updateTimelinePositions() {
  const left = `${percentForTime(new Date())}%`;
  document.documentElement.style.setProperty("--current-left", left);
}

function getSelectedStage() {
  return stageConfigs.find((stage) => stage.id === state.selectedStageId);
}

function getStageById(stageId) {
  return stageConfigs.find((stage) => stage.id === stageId);
}

function getSelectableStageById(stageId) {
  const stage = getStageById(stageId);
  return stage && !stage.isResting ? stage : null;
}

function getSelectedProgram() {
  return state.schedule.find((program) => program.id === state.selectedProgramId);
}

function getDefaultProgramForStage(stageId) {
  return isPremiereStage(stageId)
    ? getCurrentProgramForStage(stageId) ?? state.schedule.find((program) => program.stageId === stageId)
    : state.schedule.find((program) => program.stageId === stageId);
}

function getCurrentProgramForStage(stageId) {
  const now = new Date();
  return state.schedule.find((program) => program.stageId === stageId && now >= program.start && now < program.end);
}

function getNextProgramForStage(stageId, afterTime = new Date()) {
  return state.schedule.find((program) => program.stageId === stageId && program.start > afterTime);
}

function isPremiereStage(stageId = state.selectedStageId) {
  return getStageById(stageId)?.contentMode === "premiere";
}

function hasTimeline(stage) {
  return Array.isArray(stage?.timeline) && stage.timeline.length > 0;
}

function isCurrent(program) {
  if (!program) {
    return false;
  }

  const now = new Date();
  return now >= program.start && now < program.end;
}

function percentForTime(time) {
  const total = minutesBetween(state.startTime, state.endTime);
  const elapsed = minutesBetween(state.startTime, time);
  return clamp((elapsed / total) * 100, 0, 100);
}

function percentWidth(start, end) {
  const total = minutesBetween(state.startTime, state.endTime);
  return (minutesBetween(start, end) / total) * 100;
}

function buildEmbedUrl(videoId, seekSeconds = null, autoplay = false) {
  const isMobile = window.matchMedia("(max-width: 820px)").matches;
  const params = new URLSearchParams({
    autoplay: autoplay || !isMobile ? "1" : "0",
    mute: "0",
    rel: "0",
    playsinline: "1",
  });

  if (Number.isFinite(seekSeconds) && seekSeconds >= 0) {
    params.set("start", String(Math.floor(seekSeconds)));
  }

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

function stageNameFor(stageId) {
  return stageConfigs.find((stage) => stage.id === stageId)?.name ?? "";
}

function formatTime(date) {
  return new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatCountdown(targetDate) {
  const diff = Math.max(0, targetDate.getTime() - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function minutesBetween(start, end) {
  return (end.getTime() - start.getTime()) / 60000;
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

function combineDateAndTime(baseDate, timeString, referenceStart = null) {
  const [hours, minutes] = timeString.split(":").map(Number);
  const combined = new Date(baseDate);
  combined.setHours(hours, minutes, 0, 0);

  if (referenceStart && combined <= referenceStart) {
    combined.setDate(combined.getDate() + 1);
  }

  return combined;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

init();

