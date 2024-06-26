import { fetchFilteredTenders } from "@/lib/data";
import SearchResultCard from "./search-result-card";


export default async function SearchResults({
  q,
  min_date,
  max_date,
  currentPage,
}: {
  q: string;
  min_date: string,
  max_date: string,
  currentPage: number;
  // ...
}) {
  const tenders = await fetchFilteredTenders(q, min_date, max_date, currentPage);

  return <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    {tenders.map(t => <SearchResultCard key={t.publicatieid} tender={t} />)}
  </div>
}