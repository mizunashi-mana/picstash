# コード署名手順

macOS 向けの pkg インストーラーを Apple Developer Account の証明書で署名し、Gatekeeper による警告を回避する手順です。

## 概要

macOS では、署名されていないアプリケーションをインストールしようとすると「開発元を確認できません」という警告が表示されます。これを回避するには、Apple Developer Program に登録し、Developer ID 証明書でアプリケーションを署名する必要があります。

## 前提条件

- Apple ID（Apple Developer Program 登録に必要）
- 年間 $99 USD の Apple Developer Program 費用

## 手順

### 1. Apple Developer Program への登録

1. [Apple Developer Program](https://developer.apple.com/programs/) にアクセス
2. 「Enroll」をクリック
3. Apple ID でサインイン（または新規作成）
4. 必要な情報を入力
   - 個人開発者の場合: 氏名、住所等
   - 法人の場合: D-U-N-S 番号が必要
5. 年間 $99 USD を支払い
6. 登録完了まで最大 48 時間待機

### 2. Developer ID 証明書の取得

#### 2.1 秘密鍵と証明書署名要求 (CSR) の作成

openssl を使用して秘密鍵と CSR を作成します:

```bash
# 秘密鍵の生成（2048ビット RSA）
openssl genrsa -out developer_id.key 2048

# CSR の作成
openssl req -new -key developer_id.key -out developer_id.csr \
  -subj "/emailAddress=your-email@example.com/CN=Picstash Developer ID/C=JP"
```

> **注意**: `emailAddress` には Apple Developer アカウントのメールアドレスを、`CN` には任意の通称を、`C` には国コードを指定します。

#### 2.2 Developer ID 証明書の発行

1. [Apple Developer Certificates](https://developer.apple.com/account/resources/certificates/list) にアクセス
2. 「+」ボタンをクリックして新規証明書を作成
3. 「Developer ID Installer」を選択（pkg ファイルの署名用）
   - アプリケーション本体の署名も必要な場合は「Developer ID Application」も作成
4. 「続ける」をクリック
5. 作成した `developer_id.csr` ファイルをアップロード
6. 「続ける」をクリックし、証明書（`.cer` ファイル）をダウンロード

#### 2.3 証明書の変換と .p12 ファイルの作成

ダウンロードした証明書と秘密鍵を結合して `.p12` ファイルを作成します:

```bash
# DER 形式の証明書を PEM 形式に変換
openssl x509 -inform DER -in developerID_installer.cer -out developer_id.pem

# 証明書の内容を確認（証明書名を確認）
openssl x509 -in developer_id.pem -noout -subject
# 出力例: subject=UID=XXXXXXXXXX, CN=Developer ID Installer: Your Name (XXXXXXXXXX), ...

# 秘密鍵と証明書を結合して .p12 ファイルを作成
openssl pkcs12 -export -out developer_id.p12 \
  -inkey developer_id.key \
  -in developer_id.pem \
  -password pass:YOUR_STRONG_PASSWORD
```

> **重要**:
> - `developer_id.key`（秘密鍵）は安全に保管し、絶対に公開しないでください
> - `.p12` ファイルのパスワードは GitHub Secrets に登録するため、強力なものを設定してください

### 3. 証明書ファイルの管理

GitHub Actions で使用するために、以下のファイルを準備します:

| ファイル | 説明 |
|---------|------|
| `developer_id.p12` | GitHub Secrets に Base64 エンコードして登録 |
| `developer_id.key` | 秘密鍵（安全に保管、GitHub には登録しない） |
| `developer_id.pem` | PEM 形式の証明書（バックアップ用） |

### 4. GitHub Secrets の設定

リポジトリの Settings → Secrets and variables → Actions で以下を設定:

| Secret 名 | 内容 |
|-----------|------|
| `APPLE_CERTIFICATE_P12` | `.p12` ファイルの Base64 エンコード |
| `APPLE_CERTIFICATE_PASSWORD` | `.p12` ファイルのパスワード |
| `APPLE_TEAM_ID` | Apple Developer Team ID（10桁の英数字） |

#### Base64 エンコードの方法

```bash
base64 -i certificate.p12 | pbcopy
```

クリップボードにコピーされた文字列を `APPLE_CERTIFICATE_P12` に設定します。

### 5. electron-builder の設定

`packages/desktop-app/electron-builder.json` に署名設定を追加:

```json
{
  "mac": {
    "category": "public.app-category.photography",
    "target": [
      {
        "target": "pkg",
        "arch": ["arm64", "x64"]
      }
    ],
    "identity": "Developer ID Installer: Your Name (XXXXXXXXXX)"
  }
}
```

> **注意**: `identity` には証明書の正確な名前を指定します。`openssl x509 -in developer_id.pem -noout -subject` で確認できます。

### 6. GitHub Actions ワークフローの更新

`.github/workflows/release.yml` の macOS ビルドジョブに証明書のインポート手順を追加:

```yaml
- name: Import code signing certificate
  if: matrix.os == 'macos-latest'
  env:
    APPLE_CERTIFICATE_P12: ${{ secrets.APPLE_CERTIFICATE_P12 }}
    APPLE_CERTIFICATE_PASSWORD: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}
  run: |
    # 一時キーチェーンを作成
    KEYCHAIN_PATH=$RUNNER_TEMP/app-signing.keychain-db
    KEYCHAIN_PASSWORD=$(openssl rand -base64 32)

    security create-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN_PATH"
    security set-keychain-settings -lut 21600 "$KEYCHAIN_PATH"
    security unlock-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN_PATH"

    # 証明書をインポート
    echo "$APPLE_CERTIFICATE_P12" | base64 --decode > certificate.p12
    security import certificate.p12 -P "$APPLE_CERTIFICATE_PASSWORD" -A -t cert -f pkcs12 -k "$KEYCHAIN_PATH"
    security list-keychain -d user -s "$KEYCHAIN_PATH"

    # クリーンアップ
    rm certificate.p12
```

## 公証 (Notarization)

署名だけでなく、Apple の公証サービスにアプリを送信することで、さらにセキュリティ警告を減らすことができます。

### 公証に必要な追加 Secrets

| Secret 名 | 内容 |
|-----------|------|
| `APPLE_ID` | Apple Developer アカウントのメールアドレス |
| `APPLE_APP_SPECIFIC_PASSWORD` | アプリ用パスワード（2FA 用） |

### アプリ用パスワードの取得

1. [Apple ID 管理ページ](https://appleid.apple.com/) にアクセス
2. 「サインインとセキュリティ」→「アプリ用パスワード」
3. 「+」をクリックして新しいパスワードを生成
4. 生成されたパスワードを `APPLE_APP_SPECIFIC_PASSWORD` に設定

### electron-builder の公証設定

```json
{
  "mac": {
    "notarize": true
  }
}
```

環境変数でも設定可能:

```yaml
env:
  APPLE_ID: ${{ secrets.APPLE_ID }}
  APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}
  APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
```

## Windows の署名（参考）

Windows 向けの署名には EV コードサイニング証明書が必要です。取得には:

1. 認証局（DigiCert, Sectigo 等）から証明書を購入
2. HSM（ハードウェアセキュリティモジュール）が必要な場合あり
3. electron-builder の `win.certificateFile` と `win.certificatePassword` を設定

詳細は [electron-builder のドキュメント](https://www.electron.build/code-signing) を参照してください。

## トラブルシューティング

### 「開発元を確認できません」警告が表示される

- 証明書が正しく .p12 に含まれているか確認
- `identity` の値が証明書名と一致しているか確認
- 公証が完了しているか確認

### ビルド時に署名エラー

```
Error: Cannot find valid 'Developer ID Installer' identity
```

- GitHub Secrets の `APPLE_CERTIFICATE_P12` が正しくエンコードされているか確認
- パスワードが正しいか確認
- 証明書が有効期限内か確認
- .p12 ファイルに秘密鍵が含まれているか確認:
  ```bash
  openssl pkcs12 -in developer_id.p12 -nokeys -passin pass:PASSWORD | openssl x509 -noout -subject
  openssl pkcs12 -in developer_id.p12 -nocerts -passin pass:PASSWORD -passout pass:temp | head -1
  ```

### 公証が失敗する

- アプリ用パスワードが正しいか確認
- Hardened Runtime が有効か確認（electron-builder はデフォルトで有効）
- [Apple の公証ログ](https://developer.apple.com/account/resources/certificates/notarize) でエラー詳細を確認

## 参考リンク

- [Apple Developer Program](https://developer.apple.com/programs/)
- [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/certificates/list)
- [electron-builder Code Signing](https://www.electron.build/code-signing)
- [Notarizing macOS Software Before Distribution](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
