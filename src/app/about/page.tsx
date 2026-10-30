import { ProjectView, projectMetadata } from "@/views/project";

export const metadata = projectMetadata("about");

export default function Page() {
  return <ProjectView page="about" />;
}
