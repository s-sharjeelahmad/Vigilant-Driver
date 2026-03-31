import apiClient, { tokenManager } from './apiClient';

export interface LoginCredentials {
  driver_id: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface Driver {
  driver_id: string;
  cnic: string;
  full_name: string;
  phone_number?: string;
  email?: string;
  license_number: string;
  license_expiry?: string;
  date_of_birth?: string;
  age?: number;
  gender?: string;
  address?: string;
  city?: string;
  profile_image_url?: string;
  experience_years?: number;
  is_active: boolean;
  risk_score: number;
  created_at: string;
  updated_at: string;
  last_active: string;
}

export interface DriverUpdate {
  full_name?: string;
  phone_number?: string;
  email?: string;
  address?: string;
  city?: string;
  profile_image_url?: string;
}

class AuthService {
  /**
   * Login with driver ID and password
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
      
      // Save token to secure storage
      await tokenManager.saveToken(response.data.access_token);
      
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Driver not found');
      } else if (error.response?.status === 400) {
        throw new Error('Invalid password');
      }
      throw new Error('Login failed. Please try again.');
    }
  }

  /**
   * Get current logged-in driver information
   */
  async getCurrentDriver(): Promise<Driver> {
    try {
      const response = await apiClient.get<Driver>('/driver/me');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      throw new Error('Failed to fetch driver information');
    }
  }

  /**
   * Update driver profile
   */
  async updateDriver(updates: DriverUpdate): Promise<Driver> {
    try {
      const response = await apiClient.put<Driver>('/driver/update', updates);
      return response.data;
    } catch {
      throw new Error('Failed to update profile');
    }
  }

  /**
   * Logout - clears token
   */
  async logout(): Promise<void> {
    await tokenManager.deleteToken();
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    return await tokenManager.hasValidToken();
  }
}

export const authService = new AuthService();
