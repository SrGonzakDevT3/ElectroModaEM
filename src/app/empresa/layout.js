import { redirect } from "next/navigation";
import { getSession, isCompany } from "../../lib/auth";

export const dynamic = "force-dynamic";

export default async function CompanyLayout({ children }) {
  const user = await getSession();

  if (!user) redirect("/login");
  if (!isCompany(user)) redirect("/perfil");

  return children;
}
