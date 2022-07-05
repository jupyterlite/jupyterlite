// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

/**
 * A WebWorker entrypoint that uses comlink to handle postMessage details
 */
import { expose } from 'comlink';

import { JavaScriptRemoteKernel } from './worker';

const worker = new JavaScriptRemoteKernel();

expose(worker);
