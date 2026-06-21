# AI LIVE TIMETABLE 管理者向け更新マニュアル

## 概要

このサイトの本番設定は Cloudflare KV で管理しています。  
今後は GitHub へ push したり、Cloudflare Pages を再デプロイしなくても、Cloudflare ダッシュボード上で JSON を書き換えるだけで更新できます。

対象サイト:

- Pages プロジェクト名: `live-timetable-player`
- 本番 URL: `https://live-timetable-player.pages.dev/`
- KV namespace 名: `live-timetable-config`
- KV key 名: `stage-config`

## 更新すると何が変わるか

`stage-config` の JSON を更新すると、各ステージの以下が切り替わります。

- 配信モード: `premiere` または `video`
- 表示タイトル
- YouTube URL
- プレミア公開ステージのタイムテーブル

## 更新手順

1. Cloudflare ダッシュボードにログイン
2. 左メニューの `Storage & databases` を開く
3. `KV` を開く
4. `live-timetable-config` を開く
5. `KV Pairs` タブを開く
6. `stage-config` の行の `View` もしくは `...` から編集画面を開く
7. JSON を書き換えて保存
8. 本番サイト `https://live-timetable-player.pages.dev/` を再読み込みして確認

補足:

- 通常は再デプロイ不要です
- 反映まで数秒から数十秒かかることがあります
- `stage-config.local.json` はローカル確認用なので、本番には影響しません

## JSON のルール

設定は `neo` `void` `echo` の3ステージです。

### 1. `contentMode`

- `premiere`: プレミア公開
- `video`: 通常の YouTube 動画

### 2. `title`

画面に表示するタイトルです。

### 3. `youtubeUrl`

YouTube の URL をそのまま入れます。  
`https://youtu.be/...` でも `https://www.youtube.com/watch?v=...` でも使えます。

### 4. `timeline`

`premiere` のときだけ使います。  
`start` と `end` は `HH:MM` 形式で記入します。

例:

```json
{ "start": "19:00", "end": "21:30", "title": "オープニング ～ 35 artists" }
```

## 現在の本番用 JSON 例

```json
{
  "neo": {
    "contentMode": "premiere",
    "title": "DAY 1",
    "youtubeUrl": "https://youtu.be/Y00aijSgbo4?si=5L1h0oQDcDNLDPPk",
    "timeline": [
      { "start": "19:00", "end": "21:30", "title": "オープニング ～ 35 artists" }
    ]
  },
  "void": {
    "contentMode": "premiere",
    "title": "DAY 2",
    "youtubeUrl": "https://www.youtube.com/watch?v=4ZcmQB-O_rA",
    "timeline": [
      { "start": "19:00", "end": "21:50", "title": "オープニング ～ 35 artists ～ フィナーレ＆エンディング" }
    ]
  },
  "echo": {
    "contentMode": "video",
    "title": "Live \"SAIHATE\"",
    "youtubeUrl": "https://youtu.be/XQfk5PReT-c"
  }
}
```

## よくある更新パターン

### 通常動画に差し替える

1. 対象ステージの `contentMode` を `video` にする
2. `title` を更新する
3. `youtubeUrl` を更新する
4. `timeline` は不要なら削除してよい

### プレミア公開に差し替える

1. 対象ステージの `contentMode` を `premiere` にする
2. `title` を更新する
3. `youtubeUrl` を更新する
4. `timeline` を更新する

## 更新時の注意

- JSON のカンマや `{}` が壊れると反映されません
- ステージ名のキーは `neo` `void` `echo` のまま変更しません
- 時刻は必ず `19:00` のような 24 時間表記にします
- YouTube 側でチャットが無効な動画は、右側のチャット欄が空のままになることがあります

## うまく反映されないとき

1. JSON の記述ミスがないか確認
2. 保存できているか確認
3. 本番サイトを再読み込み
4. 数十秒待って再読み込み
5. それでも変わらなければ、Cloudflare 側の `stage-config` の内容を再確認

