import { ProjectView, projectMetadata } from "@/views/project";

export const metadata = projectMetadata("architecture");

export default function Page() {
  return <ProjectView page="architecture" />;
}
