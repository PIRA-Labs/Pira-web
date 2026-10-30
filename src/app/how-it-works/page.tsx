import { ProjectView, projectMetadata } from "@/views/project";

export const metadata = projectMetadata("how-it-works");

export default function Page() {
  return <ProjectView page="how-it-works" />;
}
