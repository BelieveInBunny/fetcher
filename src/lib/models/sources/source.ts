import { SourceDefaults, FetchOptions } from '../../../types';
import { Group } from '../group';

export abstract class Source {
  public static registered: { [type: string]: any } = {}; // public for testing only
  public static activeSources: Source[] = [];
  type: string; // rss or irc
  fetchType: string; // torrent or http
  defaults: SourceDefaults;
  group: Group;

  constructor(type: string, fetchType: string, defaults: SourceDefaults, group: Group) {
    this.type = type;
    this.fetchType = fetchType;
    this.defaults = defaults;
    this.group = group;
  }

  public static registerSourceType(type: string, cls: any) {
    Source.registered[type] = cls;
  }

  public static createSource(type: string, group: Group, fetchType: string, options: any) {
    if (!Source.registered[type]) throw new Error(`Source type ${type} does not exist`);
    const source: Source = new Source.registered[type](group, fetchType, options);
    Source.activeSources.push(source);
    return source;
  }

  public static async removeAllSources() {
    const currentSources = Source.activeSources;
    Source.activeSources = [];
    await Promise.all(currentSources.map(async (source) => source.close()));
  }

  public getFetcherOptions(link: string): FetchOptions {
    if (this.fetchType === 'torrent') return { uri: link };
    if (this.fetchType === 'http') return { url: link };
    throw new Error(`Unknown fetcher type ${this.fetchType}`);
  }

  abstract fetch(): void | Promise<void>;

  abstract close(): void | Promise<void>;
}
