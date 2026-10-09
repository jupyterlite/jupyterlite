// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { ServerConnection } from '@jupyterlab/services';

export function notFoundError(path: string): ServerConnection.ResponseError {
  const response = new Response(null, { status: 404, statusText: 'Not Found' });
  return new ServerConnection.ResponseError(response, `Path ${path} does not exist.`);
}

/**
 * The error Jupyter Server returns when a binary file is requested as text.
 */
export function notUtf8Error(path: string): ServerConnection.ResponseError {
  const response = new Response(null, { status: 400, statusText: 'bad format' });
  return new ServerConnection.ResponseError(response, `${path} is not UTF-8 encoded`);
}
