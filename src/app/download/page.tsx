import { ProjectView, projectMetadata } from "@/views/project";

export const metadata = projectMetadata("download");

export default function Page() {
  return <ProjectView page="download" />;
}
