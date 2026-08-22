type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/** クエリパラメータとして指定できる値 */
type QueryValue = string | number | boolean | undefined | null;

interface ApiOptions {
  headers?: Record<string, string>;
  token?: string;
  /** クエリ文字列としてURLに付与する。undefined/null/空文字のキーは送信しない */
  params?: Record<string, QueryValue>;
}

interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

// 末尾スラッシュを除去し、routePath側の先頭スラッシュと合わせて二重スラッシュになるのを防ぐ
const BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
).replace(/\/+$/, '');

/** BASE_URL・パス・クエリを結合してリクエストURLを組み立てる */
function buildUrl(routePath: string, params?: Record<string, QueryValue>): string {
  // 呼び出し側の先頭スラッシュの有無に関わらず正しく連結する
  const path = routePath.startsWith('/') ? routePath : `/${routePath}`;
  const url = `${BASE_URL}${path}`;

  if (!params) return url;

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.append(key, String(value));
  }

  const queryString = search.toString();
  return queryString ? `${url}?${queryString}` : url;
}

// Server側でCookieからトークンを取得
async function getServerToken(): Promise<string | undefined> {
  if (typeof window !== 'undefined') return undefined;

  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    return cookieStore.get("token")?.value;
  } catch (error) {
    console.warn('Server token retrieval failed:', error);
    return undefined;
  }
}

/** レスポンスからエラーメッセージを取り出す（FastAPIのdetailを優先） */
async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    const detail = body?.detail;
    if (typeof detail === 'string') return detail;
    // バリデーションエラー(422)は配列で返るためJSON文字列化して原因を残す
    if (detail) return JSON.stringify(detail);
  } catch {
    // JSON以外のレスポンスはステータスのみで判断する
  }
  return `HTTP Error: ${response.status} ${response.statusText}`;
}

async function apiCall<T>(
  method: HttpMethod,
  routePath: string,
  body?: object | FormData | null,
  options: ApiOptions = {}
): Promise<ApiResponse<T>> {
  // オプションで渡されたtokenを優先
  let token = options.token;

  // トークンはhttpOnly Cookieのためクライアントからは読めない。
  // api.* はServer Actions / Route Handler から呼ぶ前提で、サーバー側でのみ取得する。
  if (!token) {
    token = await getServerToken();
  }

  const { headers = {}, params } = options;
  const isFormData = body instanceof FormData;
  const config: RequestInit = {
    method,
    headers: {
      // FormDataの場合はboundary付与のためContent-Typeをfetchに任せる
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      Accept: "application/json",
      ...headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };

  if (method !== 'GET' && method !== 'DELETE' && body) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  const url = buildUrl(routePath, params);

  try {
    console.log("API Call:", method, url);
    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error(await extractErrorMessage(response));
    }

    // 204 No Content（削除API等）はボディが無いためJSONパースしない
    const contentType = response.headers.get('content-type');
    const data =
      response.status === 204 || !contentType?.includes('application/json')
        ? (null as T)
        : ((await response.json()) as T);

    return {
      data,
      status: response.status,
      statusText: response.statusText,
    };
  } catch (error) {
    console.error('API Call Error:', error);
    throw error;
  }
}

export const api = {
  get: <T = unknown>(routePath: string, options?: ApiOptions) =>
    apiCall<T>('GET', routePath, undefined, options),

  post: <T = unknown>(routePath: string, body?: object | FormData, options?: ApiOptions) =>
    apiCall<T>('POST', routePath, body, options),

  put: <T = unknown>(routePath: string, body?: object | FormData, options?: ApiOptions) =>
    apiCall<T>('PUT', routePath, body, options),

  delete: <T = unknown>(routePath: string, options?: ApiOptions) =>
    apiCall<T>('DELETE', routePath, undefined, options),

  patch: <T = unknown>(routePath: string, body?: object | FormData, options?: ApiOptions) =>
    apiCall<T>('PATCH', routePath, body, options),
};
