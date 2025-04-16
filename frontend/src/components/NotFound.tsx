import React from "react";
import Container from "./ui/Container";

export default function NotFound() {
  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <Container title="Page Not Found" subtitle="The page you're looking for doesn't exist">
      <div className="text-center space-y-6">
        <div className="text-6xl font-bold text-slate-300">404</div>
        <p className="text-slate-600">We couldn't find the page you're looking for.</p>
        <button
          onClick={handleGoBack}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Go back
        </button>
      </div>
    </Container>
  );
}
