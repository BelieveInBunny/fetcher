import { SinonSandbox, createSandbox, assert } from 'sinon';
import { expect } from 'chai';
import * as episodeParser from './episodeParser';

describe('episodeParser', () => {
  let sandbox: SinonSandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('parseWantedEpisode', () => {
    let fakeShow: any;
    let fakeSource: any;
    const fakeFetchOptions: any = 'fetchOptions';
    const validFileName = '[TerribleSubs] Some アニメ - 01 [720p][123A4BC5].mkv';

    beforeEach(() => {
      episodeParser.clearUnpasableCache();
      fakeShow = {
        name: 'showName',
        groupID: 'groupID',
        wantedResolutions: { includes: () => true }, // Fake accepting all resolutions for testing
        releasers: {
          groupKey: {
            media: 'releaserMedia',
            subbing: 'releaserSubbing',
          },
        },
      };
      fakeSource = {
        fetchType: 'fetchType',
        defaults: {},
        group: {
          findShow: sandbox.stub().returns(fakeShow),
          key: 'groupKey',
          name: 'groupName',
        },
      };
    });

    it('assigns fetchOptions to parsed episode', () => {
      const episode = episodeParser.parseWantedEpisode(validFileName, fakeFetchOptions, fakeSource);
      if (!episode) expect.fail(`Episode for file ${validFileName} did not parse properly`);
      expect(episode.fetchOptions).to.equal('fetchOptions');
    });

    it('assigns options from provided source', () => {
      const episode = episodeParser.parseWantedEpisode(validFileName, fakeFetchOptions, fakeSource);
      if (!episode) expect.fail(`Episode for file ${validFileName} did not parse properly`);
      expect(episode.showName).to.equal(fakeShow.name);
      expect(episode.groupID).to.equal(fakeShow.groupID);
      expect(episode.media).to.equal(fakeShow.releasers.groupKey.media);
      expect(episode.subbing).to.equal(fakeShow.releasers.groupKey.subbing);
      expect(episode.groupName).to.equal(fakeSource.group.name);
      expect(episode.fetchType).to.equal(fakeSource.fetchType);
    });

    it('correctly parses filenames into episodes with expected values', () => {
      const files = [
        '[TerribleSubs] Some アニメ - 01 [720p][123A4BC5].mkv',
        '[TerribleSubs]_Some_アニメ_-_01_[BD720p][123A4BC5].mkv',
        '[TerribleSubs]_Some_アニメ_-_EP01_[720p][123A4BC5].mkv',
        'Some アニメ S02E01 [720p][123A4BC5].mkv',
        'Some アニメ Ep01 (720p) (123A4BC5).mkv',
        'Some_アニメ_720p_-_Ep01_-_The Name of the Episode_(123A4BC5).mkv',
        '(DVDアニメ) Some_アニメ 第01話 「のののののの」[23m37s 720p XviD 123A4BC5 MP3 48KHz 128Kbps].mkv',
        '[SomeOne] Some アニメ (123A4BC5) 01 [BD 1280x720 x264 AAC].mkv',
        '[SomeOne]Someアニメ.EP01(BD.720p.FLAC)[123A4BC5].mkv',
        '[SomeOne]_Some_アニメ-_01_[h264-720p][123A4BC5].mkv',
        '[SomeOne]_Some_アニメ-_01_[720p_Hi10P_AAC][123A4BC5].mkv',
        '[SomeOne]_Some_アニメ_-_01_[720p_x264]_[10bit]_[123A4BC5].mkv',
        '[SomeOne]_Some_アニメ_-_01_[720p_x264]_[10bit]_[123A4BC5].mkv.torrent',
      ];

      files.forEach((file) => {
        const episode = episodeParser.parseWantedEpisode(file, fakeFetchOptions, fakeSource);
        if (!episode) expect.fail(`Episode for file ${file} did not parse properly`);
        expect(episode.episode).to.equal(1);
        expect(episode.version).to.equal(1);
        expect(episode.resolution).to.equal('720p');
        expect(episode.container).to.equal('mkv');
        expect(episode.crc).to.equal('123A4BC5');
      });
    });

    it('should parse the version if it exists and is within range', function () {
      let file = '[TerribleSubs] Some アニメ - 01v2 [720p].mkv';
      let episode = episodeParser.parseWantedEpisode(file, fakeFetchOptions, fakeSource);
      if (!episode) expect.fail(`Episode for file ${file} did not parse properly`);
      expect(episode.version).to.equal(2);

      file = '[TerribleSubs] Some アニメ - 01v20 [720p].mkv';
      episode = episodeParser.parseWantedEpisode(file, fakeFetchOptions, fakeSource);
      if (!episode) expect.fail(`Episode for file ${file} did not parse properly`);
      expect(episode.version).to.equal(1);
    });

    it('should detect a bunch of valid resolutions', () => {
      const files = {
        'Some アニメ - 01 720p.mkv': '720p',
        'Some アニメ - 01 [1080p].mkv': '1080p',
        'Some アニメ - 01 BD480p.mkv': '848x480',
        'Some アニメ - 01 (640x480).mkv': '640x480',
        'Some アニメ - 01 720x480  .mkv': '720x480',
        'Some アニメ - 01 (704x396).mkv': '704x396',
      };

      Object.entries(files).forEach(([filename, expectedRes]) => {
        const episode = episodeParser.parseWantedEpisode(filename, fakeFetchOptions, fakeSource);
        if (!episode) expect.fail(`Episode for file ${filename} did not parse properly`);
        expect(episode.resolution).to.equal(expectedRes);
      });
    });

    it('should parse the CRC if it exists', () => {
      let file = '[TerribleSubs] Some アニメ - 01 [720p].mkv';
      let episode = episodeParser.parseWantedEpisode(file, fakeFetchOptions, fakeSource);
      if (!episode) expect.fail(`Episode for file ${file} did not parse properly`);
      expect(episode.crc).to.be.undefined;

      file = '[TerribleSubs] Some アニメ - 01 [720p][123A4BC5].mkv';
      episode = episodeParser.parseWantedEpisode(file, fakeFetchOptions, fakeSource);
      if (!episode) expect.fail(`Episode for file ${file} did not parse properly`);
      expect(episode.crc).to.equal('123A4BC5');

      file = '[TerribleSubs] Some アニメ - 01 [720p][123a4bc5].mkv'; // Lowercase
      episode = episodeParser.parseWantedEpisode(file, fakeFetchOptions, fakeSource);
      if (!episode) expect.fail(`Episode for file ${file} did not parse properly`);
      expect(episode.crc).to.equal('123A4BC5');
    });

    it('should use the last possible match for the CRC', () => {
      const file = '[TerribleSubs] Some アニメ [12345678] - 01 [720p][123A4BC5].mkv';
      const episode = episodeParser.parseWantedEpisode(file, fakeFetchOptions, fakeSource);
      if (!episode) expect.fail(`Episode for file ${file} did not parse properly`);
      expect(episode.crc).to.equal('123A4BC5');
    });

    it('should not match inconsistently formatted CRCs', () => {
      const file = '[TerribleSubs] Some アニメ - 01 [720p][Abcdabcd].mkv';
      const episode = episodeParser.parseWantedEpisode(file, fakeFetchOptions, fakeSource);
      if (!episode) expect.fail(`Episode for file ${file} did not parse properly`);
      expect(episode.crc).to.be.undefined;
    });

    it('should not match CRCs at the start of the filename', () => {
      const file = '[12345678] Some アニメ - 01 [720p].mkv';
      const episode = episodeParser.parseWantedEpisode(file, fakeFetchOptions, fakeSource);
      if (!episode) expect.fail(`Episode for file ${file} did not parse properly`);
      expect(episode.crc).to.be.undefined;
    });

    it('should use the last possible match for the episode', () => {
      const file = '[TerribleSubs] Some 99 Thing - 01 [720p][123A4BC5].mkv';
      const episode = episodeParser.parseWantedEpisode(file, fakeFetchOptions, fakeSource);
      if (!episode) expect.fail(`Episode for file ${file} did not parse properly`);
      expect(episode.episode).to.equal(1);
    });

    it('should not parse if it cannot find a matching show', () => {
      fakeSource.group.findShow.returns(undefined);
      const episode = episodeParser.parseWantedEpisode(validFileName, fakeFetchOptions, fakeSource);
      expect(episode).to.be.undefined;
    });

    it('should not match container with whitespaces', () => {
      const file = '[TerribleSubs] Some アニメ - 01 [720p][123A4BC5].mkv v2';
      const episode = episodeParser.parseWantedEpisode(file, fakeFetchOptions, fakeSource);
      expect(episode).to.be.undefined;
    });

    it('should not match with missing container', () => {
      const file = '[TerribleSubs] Some アニメ - 01 [720p][123A4BC5]';
      const episode = episodeParser.parseWantedEpisode(file, fakeFetchOptions, fakeSource);
      expect(episode).to.be.undefined;
    });

    it('should use default container from source if not found in file', () => {
      fakeSource.defaults.container = 'mkv';
      const file = '[TerribleSubs] Some アニメ - 01 [720p][123A4BC5]';
      const episode = episodeParser.parseWantedEpisode(file, fakeFetchOptions, fakeSource);
      if (!episode) expect.fail(`Episode for file ${file} did not parse properly`);
      expect(episode.container).to.equal('mkv');
      expect(episode.saveFileName.endsWith('.mkv')).to.be.true;
    });

    it('should not parse if discovered container is different from source expected container', () => {
      fakeSource.defaults.container = 'mp4';
      const file = '[TerribleSubs] Some アニメ - 01 [720p][123A4BC5].mkv';
      const episode = episodeParser.parseWantedEpisode(file, fakeFetchOptions, fakeSource);
      expect(episode).to.be.undefined;
    });

    it('should use default resolution from source if not found in file', () => {
      fakeSource.defaults.res = '1080p';
      const file = '[TerribleSubs] Some アニメ - 01 [123A4BC5].mkv';
      const episode = episodeParser.parseWantedEpisode(file, fakeFetchOptions, fakeSource);
      if (!episode) expect.fail(`Episode for file ${file} did not parse properly`);
      expect(episode.resolution).to.equal('1080p');
    });

    it('should not parse if resolution is not wanted on the show', () => {
      fakeShow.wantedResolutions = ['1080p'];
      const file = '[TerribleSubs] Some アニメ - 01 [720p][123A4BC5].mkv';
      const episode = episodeParser.parseWantedEpisode(file, fakeFetchOptions, fakeSource);
      expect(episode).to.be.undefined;
    });

    it('should not parse if resolution is not known', () => {
      const file = '[TerribleSubs] Some アニメ - 01 [100x100][123A4BC5].mkv';
      const episode = episodeParser.parseWantedEpisode(file, fakeFetchOptions, fakeSource);
      expect(episode).to.be.undefined;
    });

    it('should not parse with no resolution', () => {
      const file = '[TerribleSubs] Some アニメ - 01 [123A4BC5].mkv';
      const episode = episodeParser.parseWantedEpisode(file, fakeFetchOptions, fakeSource);
      expect(episode).to.be.undefined;
    });

    it('should not parse with invalid episode', () => {
      const file = '[TerribleSubs] Some アニメ - 0v1 [720p][123A4BC5].mkv';
      const episode = episodeParser.parseWantedEpisode(file, fakeFetchOptions, fakeSource);
      expect(episode).to.be.undefined;
    });

    it('should not parse with empty filename', () => {
      const episode = episodeParser.parseWantedEpisode('', fakeFetchOptions, fakeSource);
      expect(episode).to.be.undefined;
    });

    it('should use unparseableCache to return early if parsing known bad filename', () => {
      episodeParser.parseWantedEpisode('bad', fakeFetchOptions, fakeSource);
      episodeParser.parseWantedEpisode('bad', fakeFetchOptions, fakeSource);
      // ensure this was only called once, even though we called function twice with same inputs
      assert.calledOnce(fakeSource.group.findShow);
    });

    it('trims .torrent off of provided filename', () => {
      const file = '[TerribleSubs] Some アニメ - 01 [720p][123A4BC5].mkv.torrent';
      const episode = episodeParser.parseWantedEpisode(file, fakeFetchOptions, fakeSource);
      if (!episode) expect.fail(`Episode for file ${file} did not parse properly`);
      expect(episode.saveFileName).to.equal('[TerribleSubs] Some アニメ - 01 [720p][123A4BC5].mkv');
    });
  });
});