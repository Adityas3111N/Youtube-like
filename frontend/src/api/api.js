import axios from "axios";
import CONFIG from "../config/conf";

const API = axios.create({//created an instance of axios. which need baseURL and headers object.
  baseURL: CONFIG.API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});//ab api me axios hai. to jo bhi kaam axios se ho vo API se karwa lenge.

//axios ke andar interceptors hote hai.
//interceptors ka use kar ke hm kisi bhi request ko send krne se phle modify kr 
// skte hai aur kisi bhi response ko process krne se phle modify kr skte hai.
//we have only two types of interceptors. request and response.

API.interceptors.request.use(
  (config) => {//config contain baseurl, req body data (post krte wqt),http methods(get,post)
  //url(actual api endpoint), request headers(authorisation, content type), params, etc.
    const token = localStorage.getItem("authToken");//when user login it stores jwt token in local so we use them in sending requests.
    if (token) config.headers.Authorization = `Bearer ${token}`;//agr token hai to harr ek request ke header me token included hoga. 
    //individually hme kuch nahi karna padega if user is login then it will automatically get verified.
    return config;
  },
  (error) => Promise.reject(error)//if there is some error and promise didn't fullfilled
  //then it rejects the promise and makes sure that error is sent to the catch block.
);

// Add a response interceptor (for error handling)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (CONFIG.ENABLE_LOGGING) console.error("API Error:", error);
    return Promise.reject(error);
  }
);//it is just this that if everything goes well then just return the response as it is
//else make sure that promise is rejected and catch block gets the error properly.

export default API;
