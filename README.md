# Mountain Weather Decision V5

V4.12までの登山ルート・複数気象モデル分析機能を、インターネット公開しやすい構成に整理した公開用パッケージです。

## V5で変わったこと

- Python標準の簡易HTTPサーバーから **Flask + Gunicorn** に変更
- Renderの `PORT` 環境変数と `0.0.0.0` bindに対応
- `render.yaml` を同梱（Render Blueprint対応）
- `/api/health` を公開用ヘルスチェックとして整備
- Open-Meteo / Geocoding / Elevation / Overpassへの通信は、引き続きサーバー経由
- 外部APIの許可ホストをホワイトリスト化
- 外部APIレスポンスに短時間のメモリキャッシュを追加
- Overpassを複数エンドポイントへ自動フォールバック
- `requirements.txt` / `Procfile` / `.gitignore` / `.env.example` を追加

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

ブラウザで以下を開きます。

```text
http://localhost:8000
```

ヘルスチェック:

```text
http://localhost:8000/api/health
```

## Renderへ公開する最短手順

### 1. GitHubへアップロード

このフォルダの中身をGitHubリポジトリのルートへ置きます。

必要ファイル:

- `server.py`
- `index.html`
- `app.js`
- `styles.css`
- `requirements.txt`
- `render.yaml`

### 2. RenderでBlueprintを作成

Render Dashboardで **New > Blueprint** を選び、GitHubリポジトリを接続してください。

ルートにある `render.yaml` が自動で読み込まれます。

設定済み内容:

- Runtime: Python
- Build: `pip install -r requirements.txt`
- Start: `gunicorn --bind 0.0.0.0:$PORT --workers 2 --threads 4 --timeout 120 server:app`
- Health check: `/api/health`

### 3. Deploy

デプロイ完了後、Renderから以下のような公開URLが発行されます。

```text
https://mountain-weather-decision.onrender.com
```

GitHubへpushすると自動再デプロイされます。

## Renderを手動設定する場合

Blueprintを使わない場合はWeb Serviceを作成し、以下を設定します。

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
| `PORT` | 8000 | ローカル起動ポート。Renderでは自動設定 |
| `UPSTREAM_TIMEOUT` | 45 | Open-Meteo等へのタイムアウト秒 |
| `OVERPASS_TIMEOUT` | 70 | Overpass APIのタイムアウト秒 |
| `CACHE_TTL` | 120 | 外部APIレスポンスのメモリキャッシュ秒 |
| `CACHE_MAX_ITEMS` | 256 | キャッシュ最大件数 |
| `MAX_OVERPASS_BYTES` | 524288 | Overpassクエリ最大サイズ |
| `OVERPASS_ENDPOINTS` | 複数既定値 | カンマ区切りのOverpass接続先 |
| `UPSTREAM_USER_AGENT` | V5既定値 | 外部APIへ送信するUser-Agent |

## 公開前に推奨すること

1. `UPSTREAM_USER_AGENT` を自分の公開URLや連絡先を含む値へ変更
2. 独自ドメインを設定する場合はHTTPSを確認
3. 多人数に公開する場合はレート制限・永続キャッシュを追加
4. Open-Meteo / OpenStreetMap / Overpassの利用条件・帰属表示を確認
5. 山岳気象の判断補助であり、安全を保証しない旨をUI上に維持

## 構成

```text
mountain-weather-v5/
├─ index.html
├─ app.js
├─ styles.css
├─ server.py
├─ requirements.txt
├─ render.yaml
├─ Procfile
├─ .env.example
├─ .gitignore
└─ README.md
```

## 注意

このアプリは登山判断を支援するプロトタイプです。気象モデル、地図データ、ルート探索結果には欠測・遅延・位置誤差・モデル誤差があり得ます。実際の登山では公式の気象情報、登山地図、現地状況と併用してください。
