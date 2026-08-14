"use client";
import { useRouter } from "next/navigation";
export default function LogoutButton() { const router = useRouter(); return <button onClick={async()=>{await fetch("/api/auth/logout",{method:"POST"}); router.push("/"); router.refresh();}} className="border px-5 py-3 rounded font-semibold">Cerrar sesión</button>; }
