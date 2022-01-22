export interface Request {
  params: {
    [k: string]: string;
  };
  url: string;
  endpoint: string;
  body: string | object;
  cookies: object;
  ip: string;
  hostname: string;
  method: string;
  queries: object;
}
