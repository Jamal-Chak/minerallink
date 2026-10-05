import { BrowserWorkspaceRepository } from "./browser-workspace-repository";
import type { WorkspaceRepository } from "./types";

export type { WorkspaceBackend, WorkspaceRepository } from "./types";
export { BrowserWorkspaceRepository } from "./browser-workspace-repository";

let activeRepository: WorkspaceRepository = new BrowserWorkspaceRepository();

export function getWorkspaceRepository(): WorkspaceRepository {
  return activeRepository;
}

/**
 * Replace the active repository (used by tests and, later, by the server
 * adapter activation path). Callers are responsible for keeping data
 * consistent when swapping backends.
 */
export function setWorkspaceRepository(repository: WorkspaceRepository): void {
  activeRepository = repository;
}
