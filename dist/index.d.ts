import { Application, AppSettings } from './server';
import { Router } from './router';
export declare function router(): Router;
export declare function init(settings?: Partial<AppSettings>): Application;
