import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { CloudPlatformConfig } from '@/types/job-spend';

interface CloudPlatformContextType {
  config: CloudPlatformConfig | null;
  loading: boolean;
  error: string | null;
}

const CloudPlatformContext = createContext<CloudPlatformContextType>({
  config: null,
  loading: true,
  error: null,
});

export const useCloudPlatform = () => {
  const context = useContext(CloudPlatformContext);
  if (!context) {
    throw new Error('useCloudPlatform must be used within a CloudPlatformProvider');
  }
  return context;
};

interface CloudPlatformProviderProps {
  children: React.ReactNode;
}

export const CloudPlatformProvider: React.FC<CloudPlatformProviderProps> = ({ children }) => {
  const [config, setConfig] = useState<CloudPlatformConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getCloudPlatformConfig();
        setConfig(response);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch cloud platform config:', err);
        // Fallback to AWS if API fails
        setConfig({
          platform: 'AWS',
          compute_service: 'EC2',
          compute_display_name: 'EC2 Cost',
          platform_display_name: 'AWS',
        });
        setError('Failed to fetch cloud platform config, using AWS defaults');
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  return (
    <CloudPlatformContext.Provider value={{ config, loading, error }}>
      {children}
    </CloudPlatformContext.Provider>
  );
};