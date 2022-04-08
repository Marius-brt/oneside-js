import { Response } from '../response';
import { Request } from '../interfaces';

export function cookieParser(req: Request, res: Response, next: () => void) {
  const cookies = req.headers.cookie || '';
  if (cookies == '') return next();
  const list: { [k: string]: string } = {};
  if (!cookies) {
    req.cookies = {};
    return list;
  }
  cookies.split(`;`).forEach((cookie) => {
    const [name, ...rest] = cookie.split(`=`);
    const nm = name?.trim();
    if (!nm) return;
    const value = rest.join(`=`).trim();
    if (!value) return;
    list[nm] = decodeURIComponent(value);
  });
  req.cookies = list;
  next();
}
