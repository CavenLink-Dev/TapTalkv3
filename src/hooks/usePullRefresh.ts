import { useCallback, useState } from 'react';

/**
 * Standard pull-to-refresh state for ScrollView / Screen.
 * Runs the optional async callback, then clears the spinner.
 */
export function usePullRefresh(onRefresh?: () => void | Promise<void>) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefresh?.();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  return { refreshing, onRefresh: handleRefresh };
}
