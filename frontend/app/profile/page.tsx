'use client'

import { UploadForm } from '@/components/upload-form'
import { UploadedDocsList } from '@/components/uploaded-docs-list'
import * as React from 'react'

export default function IndexPage() {
  const [uploadCount, setUploadCount] = React.useState(0);

  return (
    <div className="relative mx-auto max-w-2xl px-4">
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

      <h2 className="text-md font-semibold mb-4">Upload uw documenten</h2>

      <div className="mb-4">
        <UploadForm uploadCount={uploadCount} setUploadCount={setUploadCount} />
      </div>

      <h2 className="text-md font-semibold mb-4">Uw documenten</h2>

      <UploadedDocsList uploadCount={uploadCount} />

    </div>
  )
}
