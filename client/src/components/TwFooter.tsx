import React from 'react';

export default function TwFooter() {
  return (
    <footer className="bg-gray-50 border-t mt-12">
      <div className="container py-8 text-sm text-gray-600">
        <div className="flex items-center justify-between">
          <div>© {new Date().getFullYear()} TNL Motors. All rights reserved.</div>
          <div className="flex gap-4">
            <a href="/terms" className="hover:underline">Terms</a>
            <a href="/privacy" className="hover:underline">Privacy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
