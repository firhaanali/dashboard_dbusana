import { useState, useEffect } from 'react';

interface UsePageLoadingOptions {
  initialLoading?: boolean;
  minLoadingTime?: number; // Minimum loading time in milliseconds
}

export function usePageLoading(options: UsePageLoadingOptions = {}) {
  const { initialLoading = true, minLoadingTime = 500 } = options;
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [startTime] = useState(Date.now());

  const setLoading = (loading: boolean) => {
    if (!loading && minLoadingTime > 0) {
      const elapsed = Date.now() - startTime;
      const remaining = minLoadingTime - elapsed;
      
      if (remaining > 0) {
        setTimeout(() => setIsLoading(false), remaining);
      } else {
        setIsLoading(false);
      }
    } else {
      setIsLoading(loading);
    }
  };

  return {
    isLoading,
    setLoading,
    startLoading: () => setLoading(true),
    stopLoading: () => setLoading(false)
  };
}

export default usePageLoading;