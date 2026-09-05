import { redirect } from "next/navigation";

// WP-ROUTES-SUBVIEWS: the canonical spec 14 §8 destination for "Próximos vencimientos" is its
// own route. The content already exists as a query-param tab of /obligations (?tab=proximos) —
// bridge the two rather than duplicating the rendering.
export default function UpcomingObligationsPage() {
  redirect("/obligations?tab=proximos");
}
