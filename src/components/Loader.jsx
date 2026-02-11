import { FiDollarSign } from "react-icons/fi";

const Loader = ({ text = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
      <div className="relative">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-4 rounded-2xl shadow-lg shadow-indigo-500/30 animate-pulse">
          <FiDollarSign className="h-8 w-8 text-white" />
        </div>
      </div>
      <div className="h-8 w-8 rounded-full border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 animate-spin" />
      {text && (
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            {text}
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
            This may take a moment...
          </p>
        </div>
      )}
    </div>
  );
};

export default Loader;