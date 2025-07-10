// This file is kept minimal since we're using external APIs (Google Drive, Gmail)
// instead of local storage for the Pillars of Truth community website

export interface IStorage {
  // Placeholder - all data comes from Google Drive and Gmail APIs
  placeholder(): void;
}

export class MemStorage implements IStorage {
  placeholder(): void {
    // No local storage needed - everything is handled via:
    // - Google Drive API for content and gallery
    // - Gmail OAuth for authentication  
    // - Nodemailer for email routing
    console.log('Using external APIs for all data');
  }
}

export const storage = new MemStorage();
