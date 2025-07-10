import { SessionContent, GalleryItem, ContactForm, ChatMessage } from "@shared/schema";

const API_BASE = "";

export class ApiClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || response.statusText);
    }

    return response.json();
  }

  // Auth methods
  async getCurrentUser() {
    return this.request('/api/auth/me');
  }

  async login() {
    return this.request('/api/auth/login', { method: 'POST' });
  }

  async logout() {
    return this.request('/api/auth/logout', { method: 'POST' });
  }

  // Content methods
  async getSessionContent(): Promise<SessionContent[]> {
    return this.request('/api/content');
  }

  async getSessionContentBySession(session: number): Promise<SessionContent[]> {
    return this.request(`/api/content?session=${session}`);
  }

  // Gallery methods
  async getGalleryItems(): Promise<GalleryItem[]> {
    return this.request('/api/gallery');
  }

  // Contact methods
  async submitContactForm(data: ContactForm) {
    return this.request('/api/contact', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Chat methods
  async sendChatMessage(data: ChatMessage) {
    return this.request('/api/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient();
