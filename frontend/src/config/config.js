const CONFIG = {
    API_BASE_URL: process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api",
    ENABLE_LOGGING: process.env.REACT_APP_ENABLE_LOGGING === "true",
    APP_ENV: process.env.REACT_APP_ENV || "development",
    ITEMS_PER_PAGE: 12, // Default pagination limit
  };
  
  export default CONFIG;
  