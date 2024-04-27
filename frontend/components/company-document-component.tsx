'use client'

import { UploadForm } from '@/components/upload-form'
import { UploadedDocsList } from '@/components/uploaded-docs-list'
import * as React from 'react'

export function CompanyDocumentComponent() {
  'use client'
  const [uploadCount, setUploadCount] = React.useState(0);

  return (
    <>
      <h2 className="text-md font-semibold mb-4">Upload uw documenten</h2>

      <div className="mb-4">
        <UploadForm uploadCount={uploadCount} setUploadCount={setUploadCount} />
      </div>

      <h2 className="text-md font-semibold mb-4">Uw documenten</h2>

      <UploadedDocsList uploadCount={uploadCount} />
    </>
  )
}