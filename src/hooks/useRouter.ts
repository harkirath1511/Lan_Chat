import { useEffect, useState } from 'react';

export type RoutePath = '/' | '/join' | '/chat';

export function useRouter() {
  const [currentPath, setCurrentPath] = useState<RoutePath>(() => {
    if (typeof window === 'undefined') return '/';
    const path = window.location.pathname;
    if (path.startsWith('/chat')) return '/chat';
    if (path.startsWith('/join')) return '/join';
    return '/';
  });

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.startsWith('/chat')) setCurrentPath('/chat');
      else if (path.startsWith('/join')) setCurrentPath('/join');
      else setCurrentPath('/');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: RoutePath) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
      window.scrollTo(0, 0);
    }
    setCurrentPath(path);
  };

  return { currentPath, navigate };
}
