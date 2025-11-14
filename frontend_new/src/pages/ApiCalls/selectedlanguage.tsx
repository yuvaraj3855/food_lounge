import { api } from "./axios";

export async function getlanguageselector(id:string,language:any) {
  const res = await api.patch(`patient/${id}`, language);
  console.log(759,res);
  return res.data;
}
