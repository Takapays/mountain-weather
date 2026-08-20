# 山行判断ツール V5.4 — ルート検索高速化版

## V5.4 の高速化

- 一度成功した登山区間をブラウザに30日間キャッシュし、同じ区間はOverpass検索と標高API取得を省略します。
- 逆方向の同一区間も保存済みルートを再利用します。
- 初回検索は狭い範囲から探索し、接続できない場合だけ従来相当の広い範囲へ自動拡張します。
- サーバー側のOverpassレスポンスキャッシュを既定24時間に延長しました（Render再起動時には消えます）。
- 進捗表示に「保存済みルートを使用」とキャッシュ命中区間数を表示します。
- 利用ログの `trail_route_calculated.metadata.route_cache_hits` でキャッシュ効果を確認できます。

※直線フォールバック区間は誤った結果を長期間固定しないため、ブラウザキャッシュには保存しません。

---

## V5.4 リリース調整

- 「ここで宿泊」は宿泊可能地点（山小屋・避難小屋 / テント場）を選んだ場合だけ表示します。山頂・乗越・峠では表示しません。

# 山行判断ツール V5.4

V5の公開構成に、**匿名利用ログ・処理時間・エラー計測**を追加した運用改善版です。

## V5.4 リリース版

- 公開版の操作を簡素化し、「手入力地点追加」を画面から削除
- 地図クリックによる任意地点追加を停止
- 「登山道・距離を再計算」「到達時刻を再計算」を画面から削除
- ルート作成は「この順番でルートを作成」に一本化
- V5.1の匿名利用ログ機能はそのまま継承


- ページ表示 (`page_view`)
- ルート候補読込 (`route_candidates_loaded`)
- ルート作成 (`route_created`)
- 登山道・距離計算 (`trail_route_calculated`)
- 到達時刻計算 (`arrival_times_calculated`)
- 天気分析 (`weather_analysis`)
- 各処理の成功/失敗、処理時間、山名、地点数、宿泊数、エラー内容
- Supabase未設定時は Render Logs へ `[usage]` 形式で出力
- Supabase設定時は `usage_events` テーブルへ自動保存

### プライバシー方針

アプリの匿名利用ログには、氏名・メールアドレス・IPアドレスを保存しません。`session_id` はページを開くたびに生成される一時IDで、Cookie / localStorage には保存しません。

## まずはSupabaseなしでも使えます

そのままRenderへデプロイすると、Render Dashboard > Logs で以下のようなログを確認できます。

```text
[usage] {"event_name":"weather_analysis", ...}
```

永続保存したい場合だけ、以下のSupabase設定を行ってください。

## Supabaseへ利用ログを保存する

### 1. Supabaseプロジェクトを作る

Supabaseで新規Projectを作成します。

### 2. テーブルを作る

Supabase Dashboardの **SQL Editor** を開き、このパッケージの
`supabase_usage_events.sql` を貼り付けて実行してください。

作成される主なもの:

- `public.usage_events` : 生の匿名イベントログ
- `public.usage_daily_summary` : 日別の簡易集計View

### 3. Renderに環境変数を追加

Renderの `mountain-weather` Web Service > Environment に次の2つを追加します。

```text
SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxxxxx
```

`SUPABASE_SERVICE_ROLE_KEY` はブラウザ側には絶対に置かず、Renderの環境変数だけに保存してください。

保存後、Renderで再デプロイします。

### 4. 動作確認

公開サイトで一度操作した後、SupabaseのTable Editorで `usage_events` を開きます。

例:

| event_name | success | mountain | duration_ms |
|---|---|---|---:|
| page_view | true |  |  |
| route_candidates_loaded | true | 槍ヶ岳 | 3210 |
| trail_route_calculated | true | 槍ヶ岳 | 18450 |
| weather_analysis | true | 槍ヶ岳 | 6120 |

## ローカル起動

Python 3.10以上を推奨します。

```bash
python -m venv .venv
```

Windows:

```bash
.venv\Scripts\activate
pip install -r requirements.txt
python server.py
```

macOS / Linux:

```bash
source .venv/bin/activate
pip install -r requirements.txt
python server.py
```

ブラウザ:

```text
http://localhost:8000
```

ヘルスチェック:

```text
http://localhost:8000/api/health
```

`supabase_configured: false` ならRenderログのみ、`true` ならSupabase保存も有効です。

## Render設定

**Build Command**

```text
pip install -r requirements.txt
```

**Start Command**

```text
gunicorn --bind 0.0.0.0:$PORT --workers 2 --threads 4 --timeout 120 server:app
```

**Health Check Path**

```text
/api/health
```

## 環境変数

| 変数 | 既定値 | 用途 |
|---|---:|---|
| `PORT` | 8000 | ローカル起動ポート |
| `UPSTREAM_TIMEOUT` | 45 | Open-Meteo等のタイムアウト秒 |
| `OVERPASS_TIMEOUT` | 70 | Overpassタイムアウト秒 |
| `CACHE_TTL` | 120 | 外部APIメモリキャッシュ秒 |
| `CACHE_MAX_ITEMS` | 256 | キャッシュ最大件数 |
| `SUPABASE_URL` | 未設定 | Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | 未設定 | サーバー専用Service Role Key |
| `USAGE_LOG_STDOUT` | 1 | Renderログへの匿名イベント出力 |
| `USAGE_EVENT_TIMEOUT` | 8 | Supabase書込タイムアウト秒 |

## GitHubへ更新する場合

V5.4のファイル一式を既存 `mountain-weather` リポジトリへ上書きアップロードしてCommitしてください。RenderのAuto Deployが有効なら、そのCommitを検知して自動で再デプロイされます。

## 注意

このアプリは登山判断を支援するツールです。気象モデル、地図データ、ルート探索結果には欠測・遅延・位置誤差・モデル誤差があり得ます。実際の登山では公式の気象情報、登山地図、現地状況と併用してください。


## V5.4 縦走対応
- 白馬岳：栂池自然園、白馬大池、小蓮華山、杓子岳、白馬鑓ヶ岳、天狗山荘、不帰キレット、唐松岳、五竜岳、五竜山荘、アルプス平などを追加
- 槍ヶ岳：大喰岳、中岳、南岳、南岳小屋、北穂高岳などを追加
- 「次の山頂を追加（縦走）」で複数山頂を連続登録
- 宿泊設定に応じてDAY別の山行判断カードを表示


## V5.4
- ルート作成（登山道・CT・到達日時）が完了するまで「ルート全体を分析」を無効化。
- ルートや宿泊条件を変更した場合は再度無効化し、未確定の到達時刻で天気分析しないようにしました。
