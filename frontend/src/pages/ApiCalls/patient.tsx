import { api } from "./axios";

export async function getAllPatients() {
  const res = await api.get("/patient");
  console.log(759,res);
  return res.data;
}
