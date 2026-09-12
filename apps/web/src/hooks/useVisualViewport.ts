import { useEffect, useState } from 'react';

export function useVisualViewport() {
  const [viewportHeight, setViewportHeight] = useState<number>(() => {
    return typeof window !== 'undefined' && window.visualViewport
      ? window.visualViewport.height
      : typeof window !== 'undefined'
      ? window.innerHeight
      : 800;
  });

  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleResize = () => {
      if (!window.visualViewport) return;
      const height = window.visualViewport.height;
      setViewportHeight(height);

      // Keyboard detection heuristic: if visualViewport height is noticeably less than window.innerHeight
      setKeyboardOpen(window.innerHeight - height > 120);
    };

    window.visualViewport.addEventListener('resize', handleResize);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
    };
  }, []);

  return { viewportHeight, keyboardOpen };
}
