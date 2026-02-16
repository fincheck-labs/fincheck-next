const API_BASE_URL = 'http://localhost:8000'; 

export const API_ENDPOINTS = {
  getResults: `${API_BASE_URL}/api/results`,
  getResultById: (id: string) => `${API_BASE_URL}/api/results/${id}`,
  
  runSingleInference: `${API_BASE_URL}/api/run`,
  runDatasetInference: `${API_BASE_URL}/api/run-dataset`,
  
  verifyDigit: `${API_BASE_URL}/verify-digit-only`,
  
  verifyTypedText: `${API_BASE_URL}/verify-typed-text`,
};

export type EvaluationType = 'SINGLE' | 'DATASET';
export type SourceType = 'PREBUILT' | 'CUSTOM' | 'IMAGE_UPLOAD';

export interface ResultMeta {
  evaluation_type?: EvaluationType;
  source?: SourceType;
  dataset_type?: string;
  num_images?: number;
}

export interface ResultDoc {
  _id: string;
  createdAt: string;
  data: Record<string, any>;
  meta?: ResultMeta;
}

export async function fetchResults(): Promise<ResultDoc[]> {
  try {
    const response = await fetch(API_ENDPOINTS.getResults, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching results:', error);
    throw error;
  }
}

export async function fetchResultById(id: string): Promise<ResultDoc> {
  try {
    const response = await fetch(API_ENDPOINTS.getResultById(id), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching result ${id}:`, error);
    throw error;
  }
}

export async function runSingleInference(
  imageFile: any,
  expectedDigit: number,
  stressParams: {
    blur: number;
    rotation: number;
    noise: number;
    erase: number;
  }
): Promise<{ id: string }> {
  const formData = new FormData();
  
  formData.append('image', {
    uri: imageFile.uri,
    type: 'image/jpeg',
    name: 'upload.jpg',
  } as any);
  
  formData.append('expected_digit', expectedDigit.toString());
  formData.append('blur', String(stressParams.blur));
  formData.append('rotation', String(stressParams.rotation));
  formData.append('noise', String(stressParams.noise));
  formData.append('erase', String(stressParams.erase));

  try {
    const response = await fetch(API_ENDPOINTS.runSingleInference, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error running inference:', error);
    throw error;
  }
}

export async function runDatasetInference(
  datasetParams: {
    datasetName?: string;
    zipFile?: any;
  },
  stressParams: {
    blur: number;
    rotation: number;
    noise: number;
    erase: number;
  }
): Promise<{ result_id: string }> {
  const formData = new FormData();
  
  if (datasetParams.datasetName) {
    formData.append('dataset_name', datasetParams.datasetName);
  }
  
  if (datasetParams.zipFile) {
    formData.append('zip_file', {
      uri: datasetParams.zipFile.uri,
      type: 'application/zip',
      name: datasetParams.zipFile.name,
    } as any);
  }
  
  formData.append('blur', String(stressParams.blur));
  formData.append('rotation', String(stressParams.rotation));
  formData.append('noise', String(stressParams.noise));
  formData.append('erase', String(stressParams.erase));

  try {
    const response = await fetch(API_ENDPOINTS.runDatasetInference, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error running dataset inference:', error);
    throw error;
  }
}

export function getMockResults(): ResultDoc[] {
  return [
    {
      _id: 'demo-1',
      createdAt: new Date().toISOString(),
      data: {
        accuracy: 0.95,
        inference_time: 0.123,
      },
      meta: {
        evaluation_type: 'SINGLE',
        source: 'IMAGE_UPLOAD',
      },
    },
    {
      _id: 'demo-2',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      data: {
        accuracy: 0.92,
        inference_time: 1.234,
      },
      meta: {
        evaluation_type: 'DATASET',
        source: 'PREBUILT',
        dataset_type: 'MNIST_100',
        num_images: 100,
      },
    },
    {
      _id: 'demo-3',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      data: {
        accuracy: 0.88,
        inference_time: 5.678,
      },
      meta: {
        evaluation_type: 'DATASET',
        source: 'CUSTOM',
        num_images: 500,
      },
    },
    {
      _id: 'demo-4',
      createdAt: new Date(Date.now() - 259200000).toISOString(),
      data: {
        accuracy: 0.97,
        inference_time: 0.089,
      },
      meta: {
        evaluation_type: 'SINGLE',
        source: 'IMAGE_UPLOAD',
      },
    },
    {
      _id: 'demo-5',
      createdAt: new Date(Date.now() - 345600000).toISOString(),
      data: {
        accuracy: 0.91,
        inference_time: 2.456,
      },
      meta: {
        evaluation_type: 'DATASET',
        source: 'PREBUILT',
        dataset_type: 'MNIST_NOISY_100',
        num_images: 100,
      },
    },
  ];
}