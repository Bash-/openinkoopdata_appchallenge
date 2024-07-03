import { CompanyDocumentComponent } from '@/components/company-document-component'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function IndexPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="relative mx-auto max-w-2xl px-4">
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
        <p className="font-bold">Let op</p>
        <p>Deze functionaliteit is nog in ontwikkeling en doet verder nog niks!</p>
      </div>
      <h1 className="text-lg font-semibold"> Uw documenten </h1>
      <p className="leading-normal text-muted-foreground">
        Hier kunt u uw bedrijfsdocumenten uploaden en beheren.
        Deze zullen worden gebruikt om persoonlijke vragen te beantwoorden in de chat functie en worden gebruikt voor periodieke aanbevelingen.
      </p>
      <br></br>
      <p className="leading-normal text-muted-foreground">
        Uw documenten worden niet gedeeld met derden, wel worden ze samen naar de OpenAI API gestuurd om vragen te beantwoorden.
        Let daarom op dat u geen gevoelige informatie uploadt.
      </p>
      <br></br>

      <CompanyDocumentComponent />

    </div>
  )
}
