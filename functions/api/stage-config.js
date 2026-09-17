const DEFAULT_STAGE_CONFIG = {
  neo: {
    contentMode: "premiere",
    title: "ELEMAYU LIVE -little stars-",
    youtubeUrl: "https://youtu.be/0J0Rz2B4MKM",
    timeline: [
      {
        start: "18:30",
        end: "20:00",
        displayTime: "18:30 -",
        title: "ELEMAYU LIVE -little stars-",
      },
    ],
  },
  void: {
    contentMode: "premiere",
    title: "ELEMAYU Live ～little light～",
    youtubeUrl: "https://youtu.be/gqgj3EogxO8",
    timeline: [
      {
        start: "19:00",
        end: "20:30",
        displayTime: "19:00 -",
        title: "ELEMAYU Live ～little light～",
      },
    ],
  },
  echo: {
    contentMode: "premiere",
    title: 'ELEMAYU Live "SAIHATE"',
    youtubeUrl: "https://youtu.be/WatSoeuzUXQ",
    timeline: [
      {
        start: "19:30",
        end: "21:00",
        displayTime: "19:30 -",
        title: 'ELEMAYU Live "SAIHATE"',
      },
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
