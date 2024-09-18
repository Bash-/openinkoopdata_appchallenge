'use client'

import { UploadForm } from '@/components/upload-form'
import { UploadedDocsList } from '@/components/uploaded-docs-list'
import * as React from 'react'
import * as m from "@/paraglide/messages";

export function CompanyDocumentComponent() {
  'use client'
  const [uploadCount, setUploadCount] = React.useState(0);

  return (
    <>
      <h2 className="text-md font-semibold mb-4">{m.component_companydocumentcomponent_uploaddocuments()}</h2>

      <div className="mb-4">
        <UploadForm uploadCount={uploadCount} setUploadCount={setUploadCount} />
      </div>

      <h2 className="text-md font-semibold mb-4">{m.component_companydocumentcomponent_yourdocuments()}</h2>

      <UploadedDocsList uploadCount={uploadCount} />
    </>
  )
}