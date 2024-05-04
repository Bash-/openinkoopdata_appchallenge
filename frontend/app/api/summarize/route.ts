import { summarize } from "@/lib/chains/summarize";
import { Document } from "@langchain/core/documents";
import { NextResponse } from "next/server";


export async function POST(req: Request) {
  const { publicatie_id } = await req.json()

  // load all documents
  const text = `
Historische park- en tuinaanleg Berkenbosch, Duinbeek en Westhove
Het verrichten van hovenierswerkzaamheden (ook wel groenbeheer en cultuurtechnische werkzaamheden genoemd) op de landgoederen Berkenbosch, Duinbeek en Westhove. De werkzaamheden bestaan voornamelijk uit: • Laanonderhoud; • Snoeiwerk; • Herstel paden; • Onderhoud waterpartijen. Voor de te verrichten hovenierswerkzaamheden zijn per landgoed maatregelen opgesteld. 1. Historische park- en tuinaanleg Berkenbosch: ca. 22 ha 2. Historische park- en tuin aanleg Duinbeek: ca. 9 ha 3. Historische park- en tuinaanleg Westhove: ca. 23 ha
  `

  const docs = [
    new Document({
      pageContent: text
    })
  ]

  const summary = await summarize(docs)

  // insert summary in DB


  return NextResponse.json({ message: summary }, { status: 200 });
}

