export interface Settings {
  port: number;
  address: string;
  favicon: string;
  baseFile: string;
  paths: {
    views: string;
    sources: string;
    components: string;
  };
}
