// Copyright (c) JupyterLite Contributors
// Distributed under the terms of the Modified BSD License.

import { expect, test } from '@jupyterlab/galata';

import type { IJupyterLabPageFixture } from '@jupyterlab/galata';
import type { Locator } from '@playwright/test';

import {
  firefoxWaitForApplication,
  refreshFilebrowser,
  type UploadFile,
  uploadFiles,
} from './utils';

type LoadedMediaState = {
  currentSrc: string;
  readyState: number;
};

type PlayedMediaState = LoadedMediaState & {
  currentTime: number;
  duration: number;
  ended: boolean;
};

test.use({
  waitForApplication: firefoxWaitForApplication,
});

test.describe('Media', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('lab/index.html');
    await refreshFilebrowser({ page });
  });

  test('Open an audio file', async ({ page }) => {
    const audioFile = createWaveFile('00-open-audio.wav');

    await uploadFiles(page, [audioFile]);
    expect(await page.filebrowser.open(audioFile.name)).toBeTruthy();

    const audio = page.locator('.jp-AudioViewer audio');
    await expect(audio).toBeVisible();

    const mediaState = await waitForMediaReady(audio);
    expect(mediaState.readyState).toBeGreaterThanOrEqual(1);
    expect(mediaState.currentSrc).toBeTruthy();

    const playbackState = await playMediaToEnd(audio);
    expect(playbackState.duration).toBeGreaterThan(0);
    expect(playbackState.currentTime).toBeGreaterThan(0);
    expect(playbackState.ended).toBe(true);
  });

  test('Open a video file', async ({ page }) => {
    test.slow();

    const videoFile = await createWebmVideoFile(page, '01-open-video.webm');

    await uploadFiles(page, [videoFile]);
    expect(await page.filebrowser.open(videoFile.name)).toBeTruthy();

    const video = page.locator('.jp-VideoViewer video');
    await expect(video).toBeVisible();

    const mediaState = await waitForMediaReady(video);
    expect(mediaState.readyState).toBeGreaterThanOrEqual(1);
    expect(mediaState.currentSrc).toBeTruthy();

    const playbackState = await playMediaToEnd(video);
    expect(playbackState.duration).toBeGreaterThan(0);
    expect(playbackState.currentTime).toBeGreaterThan(0);
    expect(playbackState.ended).toBe(true);
  });
});

function createWaveFile(name: string): UploadFile {
  const durationSeconds = 2;
  const sampleRate = 16_000;
  const channelCount = 1;
  const bitsPerSample = 16;
  const frameCount = Math.floor(sampleRate * durationSeconds);
  const blockAlign = (channelCount * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = frameCount * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channelCount, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let index = 0; index < frameCount; index++) {
    const amplitude = Math.round(
      Math.sin((2 * Math.PI * 440 * index) / sampleRate) * 0.25 * 32767,
    );
    buffer.writeInt16LE(amplitude, 44 + index * blockAlign);
  }

  return {
    base64: buffer.toString('base64'),
    mimeType: 'audio/wav',
    name,
    size: buffer.length,
  };
}

async function createWebmVideoFile(
  page: IJupyterLabPageFixture,
  name: string,
): Promise<UploadFile> {
  const result = await page.evaluate(async () => {
    if (typeof MediaRecorder === 'undefined') {
      throw new Error('MediaRecorder is not available in this browser');
    }

    const canvas = document.createElement('canvas');
    canvas.width = 96;
    canvas.height = 96;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get a canvas context for the test video');
    }

    const stream = canvas.captureStream(10);
    const mimeType =
      ['video/webm;codecs=vp8', 'video/webm'].find((candidate) =>
        MediaRecorder.isTypeSupported(candidate),
      ) ?? '';
    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);
    const chunks: Blob[] = [];

    const recordedBlob = new Promise<Blob>((resolve, reject) => {
      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      });
      recorder.addEventListener(
        'error',
        () => {
          reject(new Error('Failed to record the test video'));
        },
        { once: true },
      );
      recorder.addEventListener(
        'stop',
        () => {
          resolve(
            new Blob(chunks, {
              type: recorder.mimeType || mimeType || 'video/webm',
            }),
          );
        },
        { once: true },
      );
    });

    const drawFrame = (background: string, label: string) => {
      context.fillStyle = background;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#ffffff';
      context.font = 'bold 18px sans-serif';
      context.fillText(label, 18, 54);
    };

    try {
      drawFrame('#0047ab', 'A');
      recorder.start(100);

      for (const [background, label] of [
        ['#0047ab', 'A'],
        ['#ff6b00', 'B'],
        ['#147d64', 'C'],
      ]) {
        drawFrame(background, label);
        await new Promise((resolve) => window.setTimeout(resolve, 180));
      }

      recorder.stop();
      const blob = await recordedBlob;
      const bytes = new Uint8Array(await blob.arrayBuffer());

      return {
        bytes: Array.from(bytes),
        mimeType: blob.type || recorder.mimeType || mimeType || 'video/webm',
      };
    } finally {
      stream.getTracks().forEach((track) => track.stop());
    }
  });

  return {
    base64: Buffer.from(result.bytes).toString('base64'),
    mimeType: result.mimeType,
    name,
    size: result.bytes.length,
  };
}

async function waitForMediaReady(locator: Locator): Promise<LoadedMediaState> {
  return locator.evaluate(async (media: HTMLMediaElement) => {
    if (media.readyState >= 1 && media.currentSrc && !media.error) {
      return {
        currentSrc: media.currentSrc,
        readyState: media.readyState,
      };
    }

    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        cleanup();
        reject(
          new Error(
            `Timed out waiting for media to load (readyState=${
              media.readyState
            }, currentSrc=${media.currentSrc || '<empty>'})`,
          ),
        );
      }, 15000);

      const cleanup = () => {
        window.clearTimeout(timeout);
        media.removeEventListener('canplay', onReady);
        media.removeEventListener('error', onError);
        media.removeEventListener('loadedmetadata', onReady);
      };

      const onReady = () => {
        cleanup();
        resolve();
      };

      const onError = () => {
        cleanup();
        reject(
          new Error(`Media failed to load (code=${media.error?.code ?? 'unknown'})`),
        );
      };

      media.addEventListener('canplay', onReady, { once: true });
      media.addEventListener('error', onError, { once: true });
      media.addEventListener('loadedmetadata', onReady, { once: true });
      media.load();
    });

    return {
      currentSrc: media.currentSrc,
      readyState: media.readyState,
    };
  });
}

async function playMediaToEnd(locator: Locator): Promise<PlayedMediaState> {
  return locator.evaluate(async (media: HTMLMediaElement) => {
    media.loop = false;
    media.muted = true;
    media.currentTime = 0;

    if (media.readyState < 2) {
      media.load();
    }

    if (!media.ended) {
      await new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(() => {
          cleanup();
          reject(
            new Error(
              `Timed out waiting for media playback to finish (currentTime=${media.currentTime}, duration=${media.duration})`,
            ),
          );
        }, 15000);

        const cleanup = () => {
          window.clearTimeout(timeout);
          media.removeEventListener('ended', onEnded);
          media.removeEventListener('error', onError);
        };

        const onEnded = () => {
          cleanup();
          resolve();
        };

        const onError = () => {
          cleanup();
          reject(
            new Error(`Media playback failed (code=${media.error?.code ?? 'unknown'})`),
          );
        };

        media.addEventListener('ended', onEnded, { once: true });
        media.addEventListener('error', onError, { once: true });

        void media.play().catch((error: Error) => {
          cleanup();
          reject(error);
        });
      });
    }

    return {
      currentSrc: media.currentSrc,
      currentTime: media.currentTime,
      duration: media.duration,
      ended: media.ended,
      readyState: media.readyState,
    };
  });
}
