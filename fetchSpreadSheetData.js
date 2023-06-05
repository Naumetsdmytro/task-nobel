// import axios from "axios";

export const fetchDataSS = () => {
  return fetch("http://localhost:3000/getDate") // Updated URL
    .then((response) => response.json());
};
