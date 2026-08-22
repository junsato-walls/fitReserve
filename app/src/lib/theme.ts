/**
 * テーマ（ライト / ダーク / システム追従）の共通定義
 *
 * 設定値はCookieに保存し、`layout.tsx`（Server Component）がサーバー側で読んで
 * `<html>` にクラスを出力する。これにより light / dark を明示選択している場合は
 * 初回描画からテーマが確定し、ちらつきが起きない。
 * `system` の場合だけはOSの設定をサーバーが知り得ないため、描画前に走る
 * インラインスクリプトが `prefers-color-scheme` を見てクラスを付ける。
 */

/** ユーザーが選べる設定値 */
export type ThemePreference = "light" | "dark" | "system";

/** 実際に適用される値（`system` を解決した結果） */
export type ResolvedTheme = "light" | "dark";

/** 設定値を保存するCookie名。認証トークンと違い、クライアントからも読み書きする */
export const THEME_COOKIE = "theme";

/** Cookie未設定時の既定。OSの設定に従う */
export const DEFAULT_THEME: ThemePreference = "system";

/** 1年間保持する */
export const THEME_MAX_AGE = 60 * 60 * 24 * 365;

export const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
    { value: "light", label: "ライト" },
    { value: "dark", label: "ダーク" },
    { value: "system", label: "システム" },
];

/** 任意の文字列を ThemePreference として解釈する（不正値は既定に倒す） */
export function parseThemePreference(value: string | undefined): ThemePreference {
    return value === "light" || value === "dark" || value === "system"
        ? value
        : DEFAULT_THEME;
}

/**
 * 描画前に実行して `<html>` にクラスを付けるスクリプト
 *
 * `system` のときだけ必要になる。サーバーはOSの配色設定を知り得ないため、
 * ここで `prefers-color-scheme` を読んで確定させる。
 * body の描画前に同期実行されるので、ちらつきは発生しない。
 */
export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var m = document.cookie.match(/(?:^|; )${THEME_COOKIE}=([^;]*)/);
    var pref = m ? decodeURIComponent(m[1]) : "${DEFAULT_THEME}";
    if (pref !== "light" && pref !== "dark") {
      pref = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    document.documentElement.classList.toggle("dark", pref === "dark");
  } catch (e) {
    /* Cookieやローカル設定が読めない環境ではライトのまま表示する */
  }
})();
`.trim();
