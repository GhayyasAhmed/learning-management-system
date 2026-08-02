"use client"

import "./Loader.css";

const Loader = () => {
  return (
    <div className="flex justify-center items-center h-screen" role="status" aria-live="polite">
      <div id='loader'></div>
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Loader;