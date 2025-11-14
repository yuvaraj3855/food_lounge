
import { api } from "./axios";

export async function getAllLanguages() {
  const res = await api.get("/languages");
  console.log(759,res);
  return res.data;
}
