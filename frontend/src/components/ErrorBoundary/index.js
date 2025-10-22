import { useRouteError } from "react-router";

const ErrorBoundary = () => {
  const error = useRouteError();
  console.error("ErrorBoundary caught:", error);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#2d4a5e] mb-4">Oops! Something went wrong.</h1>
        <p className="text-[#2d4a5e] mb-4">{error?.message || "An unexpected error occurred."}</p>
        <button
          onClick={() => window.location.href = "/"}
          className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-2 px-4 rounded hover:bg-[#4c7085]"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
};

export default ErrorBoundary;