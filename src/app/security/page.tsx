import { ProjectView, projectMetadata } from "@/views/project";

export const metadata = projectMetadata("security");

export default function Page() {
  return <ProjectView page="security" />;
}
