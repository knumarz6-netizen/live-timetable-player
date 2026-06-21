const DEFAULT_STAGE_CONFIG = {
  neo: {
    contentMode: "premiere",
    title: "DAY 1",
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
  void: {
    contentMode: "premiere",
    title: "DAY 2",
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
  echo: {
    contentMode: "video",
    title: 'Live "SAIHATE"',
    youtubeUrl: "https://youtu.be/XQfk5PReT-c",
    timeline: [
      { start: "09:30", end: "10:00", title: "FADE IN/OUT" },
      { start: "10:00", end: "10:30", title: "LOST SIGNAL" },
      { start: "10:30", end: "11:00", title: "BEYOND THE ECHO" },
      { start: "11:00", end: "11:30", title: "STATIC PULSE" },
    ],
  },
};

export const onRequestGet = async (context) => {
  const config = await readStageConfig(context.env);
  return Response.json(config, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
};

async function readStageConfig(env) {
  if (!env?.STAGE_CONFIG) {
    return DEFAULT_STAGE_CONFIG;
  }

  try {
    const rawConfig = await env.STAGE_CONFIG.get("stage-config", { type: "json" });
    return isValidStageConfig(rawConfig) ? rawConfig : DEFAULT_STAGE_CONFIG;
  } catch {
    return DEFAULT_STAGE_CONFIG;
  }
}

function isValidStageConfig(value) {
  if (!value || typeof value !== "object") {
    return false;
  }

  return ["neo", "void", "echo"].every((stageId) => {
    const stage = value[stageId];
    return stage && typeof stage === "object";
  });
}
