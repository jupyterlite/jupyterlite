// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { Workspace } from '@jupyterlab/services/lib/workspace';

import { IWorkspaces } from './tokens';

import type localforage from 'localforage';

import { PromiseDelegate } from '@lumino/coreutils';

/**
 * The name of the local storage.
 */
const DEFAULT_STORAGE_NAME = 'JupyterLite Storage';

export class Workspaces implements IWorkspaces {
  constructor(options: Workspaces.IOptions) {
    this._localforage = options.localforage;
    this._storageName = options.storageName || DEFAULT_STORAGE_NAME;
    this._storageDrivers = options.storageDrivers || null;

    this._ready = new PromiseDelegate();
  }

  /**
   * A promise that resolves when the workspace storage is fully initialized
   */
  get ready(): Promise<void> {
    return this._ready.promise;
  }

  /**
   * A lazy reference to initialized storage
   */
  protected get storage(): Promise<LocalForage> {
    return this.ready.then(() => this._storage as LocalForage);
  }

  /**
   * Prepare the storage
   */
  protected async initStorage() {
    this._storage = this.defaultWorkspaceStorage();
  }

  /**
   * Finish any initialization after server has started and all extensions are applied.
   */
  async initialize() {
    await this.initStorage();
    this._ready.resolve(void 0);
  }

  /**
   * Create a workspaces store.
   */
  protected defaultWorkspaceStorage(): LocalForage {
    return this._localforage.createInstance({
      description: 'Offline Storage for Workspaces',
      storeName: 'workspaces',
      ...this.defaultStorageOptions,
    });
  }

  /**
   * Get default options for localForage instances
   */
  protected get defaultStorageOptions(): LocalForageOptions {
    const driver = this._storageDrivers?.length ? this._storageDrivers : null;
    return {
      version: 1,
      name: this._storageName,
      ...(driver ? { driver } : {}),
    };
  }

  /** Get all the workspaces */
  async getAll(): Promise<IWorkspaces.IWorkspacesBundle> {
    const storage = await this.storage;
    const keys = await storage.keys();
    const bundle: IWorkspaces.IWorkspacesBundle = {};
    await Promise.all(
      keys.map(async (workspaceId) => {
        const workspace = await storage.getItem<Workspace.IWorkspace>(workspaceId);
        if (workspace) {
          bundle[workspaceId] = workspace;
        }
      })
    );
    return bundle;
  }

  /** Get a workspace by id */
  async getWorkspace(workspaceId: string): Promise<Workspace.IWorkspace> {
    const workspace = await (
      await this.storage
    ).getItem<Workspace.IWorkspace>(workspaceId);
    if (workspace) {
      return workspace;
    }
    throw new Error(`${workspaceId} not found`);
  }

  /** Update a workspace by id */
  async setWorkspace(
    workspaceId: string,
    workspace: Workspace.IWorkspace
  ): Promise<Workspace.IWorkspace> {
    const { data, metadata } = workspace;
    const now = new Date().toISOString();
    const dateTimes = {
      created: now,
      last_udpated: now,
    };
    await (
      await this.storage
    ).setItem<Workspace.IWorkspace>(workspaceId, {
      data,
      metadata: {
        // TODO: get these added to the upstream metadata
        ...(dateTimes as any),
        ...metadata,
      },
    });
    return this.getWorkspace(workspaceId);
  }

  /** Delete a workspace by id */
  async deleteWorkspace(workspaceId: string): Promise<Workspace.IWorkspace> {
    const workspace = await this.getWorkspace(workspaceId);
    const storage = await this.storage;
    await storage.removeItem(workspaceId);
    return workspace;
  }

  private _storageName: string = DEFAULT_STORAGE_NAME;
  private _storageDrivers: string[] | null = null;
  private _storage: LocalForage | undefined;
  private _localforage: typeof localforage;
  private _ready: PromiseDelegate<void>;
}

/** A namespace for Workspaces types */
export namespace Workspaces {
  /** Initialization options for Workspaces */
  export interface IOptions {
    localforage: typeof localforage;
    storageName?: string | null;
    storageDrivers?: string[] | null;
  }
}
