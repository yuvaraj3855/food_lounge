import { createFileRoute } from "@tanstack/react-router";
import Doctor from "@/pages/Doctor/doctor";

export const Route = createFileRoute("/doctor")({
  component: Doctor,
});
