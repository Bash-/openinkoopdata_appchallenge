import { Tender } from "@/lib/types";
import { DownloadIcon } from "@radix-ui/react-icons";

export default function TenderDocuments({
  tender
}: {
  tender: Tender
}) {
  return <ul>
    {tender.documents?.map(d =>
      <li style={{ display: 'flex', alignItems: 'center', }} key={d.id}>
        <a href={`tender/${tender.id}/documents/${d.id}`}>Chat {d.title} {d.extension}</a>
        <a target="blank" href={`${d.download_link}`}><DownloadIcon /></a>
      </li>)}
  </ul>
}