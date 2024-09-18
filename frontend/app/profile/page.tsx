import { CompanyDocumentComponent } from '@/components/company-document-component'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import * as m from '@/paraglide/messages'

export default async function ProfileIndexPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="relative mx-auto max-w-2xl px-4">
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
        <p className="font-bold">{m.profileIndexPage_alert_title()}</p>
        <p>{m.profileIndexPage_alert_message()}</p>
      </div>
      <h1 className="text-lg font-semibold">{m.profileIndexPage_header()}</h1>
      <p className="leading-normal text-muted-foreground">
        {m.profileIndexPage_description_1()}
      </p>
      <br></br>
      <p className="leading-normal text-muted-foreground">
        {m.profileIndexPage_description_2()}
      </p>
      <br></br>

      <CompanyDocumentComponent />

    </div>
  )
}