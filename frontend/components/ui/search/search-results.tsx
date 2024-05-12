import { fetchFilteredTenders } from "@/lib/data";
import SearchResultCard from "./search-result-card";


export default async function SearchResults({
  q,
  dates,
  currentPage,
}: {
  q: string;
  dates: Date[],
  currentPage: number;
  // ...
}) {
  const tenders = await fetchFilteredTenders(q, dates, currentPage);

  return <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    {tenders.map(t => <SearchResultCard key={t.id} tender={t} />)}
  </div>
}