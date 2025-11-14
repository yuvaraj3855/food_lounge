import { createFileRoute } from "@tanstack/react-router";
import Patient from "@/pages/Patient/patient";

export const Route = createFileRoute("/patient")({
  component: Patient,
});
