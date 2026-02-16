import { Platform } from 'react-native';

// API Configuration
const getBaseUrl = () => {
  if (__DEV__) {
    // Development mode
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:8000'; // Android emulator
    } else if (Platform.OS === 'ios') {
      return 'http://localhost:8000'; // iOS simulator
    }
  }
  
  // Production or physical device - replace with your actual server URL
  return 'http://YOUR_SERVER_IP:8000';
};

export const API_BASE_URL = getBaseUrl();

export const API_ENDPOINTS = {
  EXTRACT_CHEQUE: `${API_BASE_URL}/extract-cheque-amount`,
};

// Helper function to upload image with proper error handling
export async function uploadChequeImage(imageUri: string): Promise<any> {
  try {
    const formData = new FormData();
    
    const filename = imageUri.split('/').pop() || 'cheque.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('file', {
      uri: imageUri,
      name: filename,
      type,
    } as any);

    const response = await fetch(API_ENDPOINTS.EXTRACT_CHEQUE, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Network request failed')) {
      throw new Error('Network error. Please check your internet connection and server URL.');
    }
    throw error;
  }
}