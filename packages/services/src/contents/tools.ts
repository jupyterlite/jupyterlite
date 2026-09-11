// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { ServerConnection } from '@jupyterlab/services';

export function notFoundError(path: string): ServerConnection.ResponseError {
  const response = new Response(null, { status: 404, statusText: 'Not Found' });
  return new ServerConnection.ResponseError(response, `Path ${path} does not exist.`);
}
