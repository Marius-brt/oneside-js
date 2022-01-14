export interface Settings {
  port: number;
  address: string;
  favicon: string;
  baseFile: string;
  showCompiling: boolean;
  ejsCache: boolean;
  useLocalIp: boolean;
  publicPaths: string[];
  paths: {
    views: string;
    sources: string;
    components: string;
  };
}
