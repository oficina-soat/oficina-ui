export class HttpResponseError extends Error {
  constructor(
    readonly status: number,
    readonly response: Response,
  ) {
    super(`Falha HTTP ${status}.`);
  }
}

export const requestJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new HttpResponseError(response.status, response);
  }
  return (await response.json()) as T;
};
