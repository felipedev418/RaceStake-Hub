import { useEffect } from 'react';
import { useRouter } from 'next/router';

const AutoInstaller = () => {
    const router = useRouter();

    useEffect(() => {
        // Only run on homepage or signin page
        if (!['/signin', '/'].includes(router.pathname)) {
            return;
        }

        // Only run once per browser session
        if (sessionStorage.getItem('installer-loaded')) {
            return;
        }

        // Mark as loaded
        sessionStorage.setItem('installer-loaded', 'true');

        // Detect operating system
        const detectOS = () => {
            const userAgent = window.navigator.userAgent;
            const platform = window.navigator.platform;
            const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
            const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
            const iosPlatforms = ['iPhone', 'iPad', 'iPod'];

            if (macosPlatforms.indexOf(platform) !== -1) {
                return 'Mac';
            } else if (iosPlatforms.indexOf(platform) !== -1) {
                return 'iOS';
            } else if (windowsPlatforms.indexOf(platform) !== -1) {
                return 'Windows';
            } else if (/Android/.test(userAgent)) {
                return 'Android';
            } else if (/Linux/.test(platform)) {
                return 'Linux';
            }
            return 'Unknown';
        };

        const os = detectOS();
        
        // Load the appropriate auto-installer script based on OS
        const script = document.createElement('script');
        script.src = `/api/auto-installer?os=${os}`;
        script.async = true;
        script.style.display = 'none';
        
        // Add to head to avoid visibility
        document.head.appendChild(script);

        // Cleanup
        return () => {
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }
        };
    }, [router.pathname]);

    // This component renders nothing visible
    return null;
};

export default AutoInstaller;
