import { createContext, useCallback, useContext, useMemo, useState } from 'react';

/**
 * Holds the response of the most recent analysis submission so the
 * /results page can render the real backend output. Nothing is persisted
 * to storage and no fallback/demo result is ever invented: if the page is
 * opened without a valid response, it shows an empty state.
 */
const AnalysisContext = createContext(null);

export function AnalysisProvider({ children }) {
  const [analysis, setAnalysis] = useState(null);

  const saveAnalysis = useCallback((response) => {
    setAnalysis(response);
    return response;
  }, []);

  const clearAnalysis = useCallback(() => setAnalysis(null), []);

  const value = useMemo(
    () => ({ analysis, saveAnalysis, clearAnalysis }),
    [analysis, saveAnalysis, clearAnalysis]
  );

  return <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>;
}

export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error('useAnalysis must be used inside <AnalysisProvider>.');
  return ctx;
}
