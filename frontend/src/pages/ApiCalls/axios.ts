import axios from "axios";

const BASE_URL = 'http://10.11.7.95:3000';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});
