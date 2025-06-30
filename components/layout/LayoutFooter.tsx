import React from 'react';
import { useRouter } from 'next/router';

function LayoutFooter() {
  const router = useRouter();
  
  // Hide footer on signin page
  if (router.pathname === '/signin') {
    return null;
  }
  
  return <div className="flex items-center justify-center py-4" />;
}

export default React.memo(LayoutFooter);
