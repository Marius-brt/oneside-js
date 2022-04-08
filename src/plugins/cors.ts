import { Response } from '../response';
import { Request, ICors } from '../interfaces';
import deepmerge from 'deepmerge';

const defaultSettings: ICors = {
  origin: '*',
};

export const cors = (settings?: ICors): ((req: Request, res: Response, next: () => void) => void) => {
  const params = settings ? deepmerge(defaultSettings, settings) : defaultSettings;
  return (req: Request, res: Response, next: () => void) => {
    if (params.origin) res.setHeader('Access-Control-Allow-Origin', params.origin);
    if (params.methods) res.setHeader('Access-Control-Allow-Methods', params.methods.join(','));
    if (params.allowedHeaders) res.setHeader('Access-Control-Allow-Headers', params.allowedHeaders.join(','));
    if (params.credentials) res.setHeader('Access-Control-Allow-Credentials', params.credentials.toString());
    if (params.maxAge) res.setHeader('Access-Control-Max-Age', params.maxAge.toString());
    if (params.exposedHeaders) res.setHeader('Access-Control-Expose-Headers', params.exposedHeaders.join(','));
    next();
  };
};
