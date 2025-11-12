// Storage interface for future use
// This app is currently client-side only

export interface IStorage {
  // Add storage methods here if needed in the future
}

export class MemStorage implements IStorage {
  constructor() {}
}

export const storage = new MemStorage();
