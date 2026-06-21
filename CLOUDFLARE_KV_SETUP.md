# Cloudflare KV Setup

## 1. Create the KV namespace

1. Open Cloudflare Dashboard.
2. Go to `Workers & Pages`.
3. Open `KV`.
4. Create a namespace.
5. Name it `live-timetable-config` or any name you prefer.

## 2. Add the KV binding to Pages

1. Open the `live-timetable-player` Pages project.
2. Go to `Settings`.
3. Open `Bindings`.
4. Click `Add`.
5. Choose `KV namespace`.
6. Set `Variable name` to `STAGE_CONFIG`.
7. Select the namespace you created.
8. Save the binding.
9. Redeploy the project once so the binding becomes active.

## 3. Create the config key

1. Open the KV namespace you bound.
2. Add a key named `stage-config`.
3. Paste the JSON below as the value.
4. Save it.

```json
{
  "neo": {
    "contentMode": "premiere",
    "title": "DAY 1",
    "youtubeUrl": "https://youtu.be/Y00aijSgbo4?si=5L1h0oQDcDNLDPPk",
    "timeline": [
      { "start": "19:00", "end": "19:05", "title": "オープニング" },
      { "start": "19:05", "end": "20:00", "title": "1-13 and mora..." },
      { "start": "20:00", "end": "20:05", "title": "14 Baumkuchen-Man" },
      { "start": "20:05", "end": "21:00", "title": "14-28 and mora..." },
      { "start": "21:00", "end": "21:05", "title": "29 Jayz" },
      { "start": "21:05", "end": "21:30", "title": "30-35 and mora..." }
    ]
  },
  "void": {
    "contentMode": "premiere",
    "title": "DAY 2",
    "youtubeUrl": "https://www.youtube.com/watch?v=4ZcmQB-O_rA",
    "timeline": [
      { "start": "19:00", "end": "19:05", "title": "オープニング" },
      { "start": "19:05", "end": "20:00", "title": "1-13 and mora..." },
      { "start": "20:00", "end": "20:05", "title": "14 ∫varts" },
      { "start": "20:05", "end": "21:00", "title": "14-26 and mora..." },
      { "start": "21:00", "end": "21:05", "title": "27 Pink Shih Tzu (AI CREATOR PONTA)" },
      { "start": "21:05", "end": "21:45", "title": "28-35 and mora..." },
      { "start": "21:45", "end": "21:50", "title": "フィナーレ＆エンディング" }
    ]
  },
  "echo": {
    "contentMode": "video",
    "title": "Live \"SAIHATE\"",
    "youtubeUrl": "https://youtu.be/XQfk5PReT-c"
  }
}
```

## 4. Future updates

When an administrator wants to switch content later:

1. Open Cloudflare Dashboard.
2. Open the same KV namespace.
3. Open the `stage-config` key.
4. Update only these fields for `neo`, `void`, or `echo`:
   - `contentMode`: `video` or `premiere`
   - `title`: displayed title
   - `youtubeUrl`: full YouTube URL
   - `timeline`: only for `premiere`
     - `start`: `HH:MM`
     - `end`: `HH:MM`
     - `title`: slot title
5. Save the value.
6. Reload the site.

No new deploy is required after the binding is already set up.
