import { getCurrentUser } from "@/lib/actions/auth.action";
import PricingClient from "@/components/PricingClient";

export default async function PricingPage() {
    const user = await getCurrentUser();

    // Map user to a simple object for the client component
    const plainUser = user ? { uid: user.uid, name: user.name } : null;

    return <PricingClient user={plainUser} />;
}
