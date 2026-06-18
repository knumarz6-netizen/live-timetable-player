const stageConfigs = [
  {
    id: "neo",
    name: "NEO STAGE",
    shortName: "NEO",
    venue: "OUTDOOR",
    contentMode: "video",
    videoTitle: 'Live "SAIHATE"',
    color: "#c9ff2f",
    videoId: "XQfk5PReT-c",
    viewers: 12458,
  },
  {
    id: "void",
    name: "VOID STAGE",
    shortName: "VOID",
    venue: "INDOOR",
    contentMode: "video",
    videoTitle: "今聴くべき生成AI音楽50曲",
    color: "#ff4d9e",
    videoId: "BIq9_pMI8po",
    viewers: 23084,
  },
  {
    id: "echo",
    name: "ECHO STAGE",
    shortName: "ECHO",
    venue: "WAREHOUSE",
    contentMode: "video",
    videoTitle: "今聴くべき生成AI音楽62曲",
    color: "#27d3ff",
    videoId: "5mk_-OroffE",
    viewers: 9780,
  },
];

const titlesByStage = {
  neo: ["ZENITH", "RAVEN HOLLOW", "NOVA PARADOX", "SKY SHOUT"],
  void: ["LUCID FREQUENCY", "MIRAGE", "ECLIPSE DRIVE", "BLACK GLARE"],
  echo: ["FADE IN/OUT", "LOST SIGNAL", "BEYOND THE ECHO", "STATIC PULSE"],
};

const state = {
  selectedStageId: "void",
  selectedProgramId: null,
  schedule: [],
  startTime: null,
  endTime: null,
};

const elements = {
  player: document.getElementById("stagePlayer"),
  liveBadge: document.getElementById("liveBadge"),
  playerStageName: document.getElementById("playerStageName"),
  playerProgramLabel: document.getElementById("playerProgramLabel"),
  playerProgramTitle: document.getElementById("playerProgramTitle"),
  playerMetaTimeLabel: document.getElementById("playerMetaTimeLabel"),
  playerProgramTime: document.getElementById("playerProgramTime"),
  viewerMetaBlock: document.getElementById("viewerMetaBlock"),
  viewerCount: document.getElementById("viewerCount"),
  clockNow: document.getElementById("clockNow"),
  clockDate: document.getElementById("clockDate"),
  stageStatus: document.getElementById("stageStatus"),
  nextEventTitle: document.getElementById("nextEventTitle"),
  nextEventMeta: document.getElementById("nextEventMeta"),
  nextEventCountdown: document.getElementById("nextEventCountdown"),
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

function init() {
  state.schedule = buildSchedule();
  state.selectedProgramId = getDefaultProgramForStage(state.selectedStageId)?.id ?? state.schedule[0]?.id ?? null;

  renderTimeScale();
  renderTimetable();
  renderStatusRail();
  renderSelectedStage();
  bindMobileChatViewportBehavior();
  tick();
  setInterval(tick, 1000);
}

function buildSchedule() {
  const now = new Date();
  const rounded = new Date(now);
  rounded.setMinutes(Math.floor(now.getMinutes() / 15) * 15, 0, 0);

  state.startTime = addMinutes(rounded, -45);
  state.endTime = addMinutes(state.startTime, 180);

  const offsets = {
    neo: [0, 30, 60, 90],
    void: [15, 45, 75, 105],
    echo: [30, 60, 90, 120],
  };

  return stageConfigs.flatMap((stage) =>
    stage.contentMode === "premiere"
      ? offsets[stage.id].map((startOffset, index) => {
          const start = addMinutes(state.startTime, startOffset);
          const end = addMinutes(start, 30);
          return {
            id: `${stage.id}-${index}`,
            stageId: stage.id,
            title: titlesByStage[stage.id][index],
            start,
            end,
          };
        })
      : [
          {
            id: `${stage.id}-video`,
            stageId: stage.id,
            title: stage.videoTitle ?? stage.name,
            start: state.startTime,
            end: state.endTime,
          },
        ],
  );
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
          <div class="track" data-track-stage="${stage.id}">
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
      state.selectedProgramId = isPremiereStage(button.dataset.stageId)
        ? getCurrentProgramForStage(button.dataset.stageId)?.id ?? button.dataset.programId
        : button.dataset.programId;
      renderSelectedStage();
      renderStatusRail();
      renderTimetable();
    });
  });

  updateTimelinePositions();
}

function renderProgramCard(program, color) {
  const stage = getStageById(program.stageId);
  const isPremiere = stage?.contentMode === "premiere";
  const isSelected = program.id === state.selectedProgramId;
  const isLive = isCurrent(program);
  const left = percentForTime(program.start);
  const width = percentWidth(program.start, program.end);
  const cardLeft = isPremiere ? left : 0;
  const cardWidth = isPremiere ? width : 100;
  const badgeText = isPremiere
    ? isLive
      ? "ON AIR"
      : "SELECT"
    : isSelected
      ? "NOW PLAYING"
      : "WATCH";

  return `
    <button
      class="program-card ${isSelected ? "is-selected" : ""} ${isLive ? "is-live" : ""}"
      type="button"
      data-program-id="${program.id}"
      data-stage-id="${program.stageId}"
      style="left:${cardLeft}%; width:${cardWidth}%; --card-color:${color}"
    >
      <div>
        ${isPremiere ? `<div class="slot-time">${formatTime(program.start)} - ${formatTime(program.end)}</div>` : ""}
        <p class="slot-title">${program.title}</p>
      </div>
      <span class="slot-badge">${badgeText}</span>
    </button>
  `;
}

function renderStatusRail() {
  const now = new Date();
  const isPremiere = isPremiereStage();
  const stageStatuses = stageConfigs
    .map((stage) => {
      const liveProgram = getCurrentProgramForStage(stage.id);
      const selected = stage.id === state.selectedStageId;
      const statusText = stage.contentMode === "premiere" ? (liveProgram ? "ON AIR" : "NEXT UP") : "VIDEO";
      return `
        <div class="status-item ${selected ? "is-selected" : ""}">
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

  const nextProgram = getNextProgramForStage(state.selectedStageId, now);
  if (isPremiere) {
    elements.nextEventTitle.textContent = nextProgram ? nextProgram.title : "Closing Soon";
    elements.nextEventMeta.textContent = nextProgram
      ? `${stageNameFor(nextProgram.stageId)} | ${formatTime(nextProgram.start)} - ${formatTime(nextProgram.end)}`
      : `${stageNameFor(state.selectedStageId)} | Schedule end`;
    elements.nextEventCountdown.textContent = nextProgram
      ? `starts in ${formatCountdown(nextProgram.start)}`
      : "No upcoming slots";
  } else {
    const selectedProgram = getSelectedProgram();
    elements.nextEventTitle.textContent = selectedProgram?.title ?? "Featured Video";
    elements.nextEventMeta.textContent = `${stageNameFor(state.selectedStageId)} | ON-DEMAND VIDEO`;
    elements.nextEventCountdown.textContent = "Pick any lineup card to relabel this stage.";
  }
}

function renderSelectedStage() {
  const stage = getSelectedStage();
  const program = getSelectedProgram();
  const isPremiere = stage?.contentMode === "premiere";
  if (!stage || !program) {
    return;
  }

  elements.liveBadge.style.borderColor = `${stage.color}88`;
  elements.liveBadge.style.background = `${stage.color}22`;
  elements.liveBadge.textContent = isPremiere ? (isCurrent(program) ? "ON AIR" : "STANDBY") : "NOW PLAYING";
  elements.playerStageName.textContent = stage.name;
  elements.playerProgramLabel.textContent = isPremiere ? "CURRENT SLOT" : "CURRENT PICK";
  elements.playerProgramTitle.textContent = program.title;
  elements.playerMetaTimeLabel.textContent = isPremiere ? "TIME" : "TYPE";
  elements.playerProgramTime.textContent = isPremiere
    ? `${formatTime(program.start)} - ${formatTime(program.end)}`
    : "ON-DEMAND VIDEO";
  elements.viewerMetaBlock.hidden = !isPremiere;
  elements.viewerCount.textContent = stage.viewers.toLocaleString("ja-JP");
  elements.chatStagePill.textContent = stage.name;
  const nextSrc = buildEmbedUrl(stage.videoId);
  if (elements.player.getAttribute("src") !== nextSrc) {
    elements.player.src = nextSrc;
  }
  syncScheduleModeUI(stage);
  updateYouTubeChat(stage.videoId);
}

function syncScheduleModeUI(stage) {
  const isPremiere = stage?.contentMode === "premiere";
  elements.scheduleEyebrow.textContent = isPremiere ? "CLICK TO SWITCH" : "PICK A VIDEO";
  elements.scheduleTitle.textContent = isPremiere ? "TIME TABLE" : "CONTENT LINEUP";
  elements.scheduleLegend.hidden = !isPremiere;
  elements.timeScaleWrap.hidden = !isPremiere;
  elements.timetableFrame.classList.toggle("is-video-mode", !isPremiere);
}

function updateYouTubeChat(videoId) {
  const canEmbedChat = ["http:", "https:"].includes(window.location.protocol) && window.location.hostname;

  if (!canEmbedChat) {
    elements.youtubeChatFrame.removeAttribute("src");
    elements.youtubeChatHelp.textContent =
      "YouTubeライブチャットの埋め込みは、localhost などの http(s) 配信で開いた時に有効になります。";
    return;
  }

  const chatUrl = `https://www.youtube.com/live_chat?v=${videoId}&embed_domain=${window.location.hostname}`;
  elements.youtubeChatFrame.src = chatUrl;
  elements.youtubeChatHelp.textContent =
    "選択中ステージのYouTubeライブチャットを表示しています。配信側でチャットが無効な場合は表示されません。";
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

function buildEmbedUrl(videoId) {
  const isMobile = window.matchMedia("(max-width: 820px)").matches;
  const params = new URLSearchParams({
    autoplay: isMobile ? "0" : "1",
    mute: "0",
    rel: "0",
    playsinline: "1",
  });
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

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

init();
