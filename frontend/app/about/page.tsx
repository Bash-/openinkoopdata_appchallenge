// import { useScrollAnchor } from '@/lib/hooks/use-scroll-anchor'

import Link from 'next/link'

export default async function AboutPage() {

  // const { messagesRef, scrollRef, visibilityRef, isAtBottom, scrollToBottom } = useScrollAnchor()

  return (

    <div className="relative mx-auto max-w-2xl px-4">

      <h1 className="text-lg font-semibold"> Over deze app </h1>
      <p className="leading-normal text-muted-foreground">
        Dit is een open source Tenderportaal dat met behulp van AI vragen kan beantwoorden over aanbestedingen van het Rijk.
      </p>

      <p>
        Vragen of opmerkingen? Neem contact op via <a className="underline" href="mailto:info@tenderflow.eu">info@tenderflow.eu</a>
      </p>
      <p className="leading-normal text-muted-foreground">
        Ook als u geinteresseerd bent in het gebruik van deze technologie voor uw eigen organisatie, dan horen we graag van u.
      </p>
      
      <br></br>
      <p className="leading-normal text-muted-foreground">
        Deze webapplicatie wordt ontwikkeld naar aanleiding van de <Link className="underline" href="https://www.rijksoverheid.nl/onderwerpen/zakendoen-met-het-rijk/kick-off-open-inkoopdata-app-challenge"> Open Inkoopdata App Challenge</Link>.
        De code van de gehele webapplicatie is openbaar en te vinden op <Link className="underline" href="https://github.com/Bash-/openinkoopdata_appchallenge">GitHub</Link>.
      </p>
      <br></br>
      <p className="leading-normal text-muted-foreground">
        Nederland verbetert het open delen van aanbestedingsdata. En bevordert de toegankelijkheid van deze data. Hierbij staat de volgende vraag centraal: hoe kunnen we de beschikbare open data gebruiken om de impact, integriteit en effectiviteit van overheidsopdrachten te versterken?
        Deze webapplicatie probeert hier een antwoord op te geven door het makkelijker te maken voor leveranciers om aanbestedingen van het Rijk te vinden en te begrijpen.
      </p>
      <br></br>

      <h2 className="text-md font-semibold">Over de techniek achter deze app</h2>

      <p className="leading-normal text-muted-foreground">
        Voor de frontend (de user interface) bouwen we voort op de open source code van <Link className='underline' href="https://github.com/vercel/ai-chatbot">Vercels Next.js AI Chatbot template</Link>, deze is vrij gegeven onder de Apache 2.0 licentie.
      </p>
      <br></br>

      <p className="leading-normal text-muted-foreground">
        We hebben de volgende databronnen ingeladen, waar gebruikers vragen over kunnen stellen:
        <ul>
          <li> - Aankondigingen van Tenderned en bijbehorende documenten </li>
          <li> - Categorieplannen van de Rijksoverheid </li>
          <li> - Rijksvoorwaarden </li>
          <li> - De website van PIANOo Expertisecentrum Aanbesteden </li>
        </ul>
      </p>
      <br></br>

      <p className="leading-normal text-muted-foreground">
        De vragen worden met behulp van Retrieval Augmented Generation (RAG) beantwoord.
        Ons programma zoekt in de documenten naar relevante stukken tekst, dit wordt samen met de vraag naar de OpenAI API gestuurd (van dezelfde maker als ChatGPT).
        De OpenAI API genereert een antwoord en stuurt dit terug naar de gebruiker.
      </p>    
    </div>
  )
}
