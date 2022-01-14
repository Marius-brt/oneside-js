export interface Settings {
  port: number;
  address: string;
  favicon: string;
  baseFile: string;
  showCompiling: boolean;
  paths: {
    views: string;
    sources: string;
    components: string;
  };
}
