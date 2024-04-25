'use client'
import { useDropzone } from 'react-dropzone';


import * as React from 'react'
import { type DialogProps } from '@radix-ui/react-dialog'
import { toast } from 'sonner'

import { ServerActionResult, type Chat } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { IconSpinner } from '@/components/ui/icons'
import { useCopyToClipboard } from '@/lib/hooks/use-copy-to-clipboard'
import { IconShare } from '@/components/ui/icons'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { MagnifyingGlassIcon } from '@radix-ui/react-icons'
import { Input } from './ui/input'

interface UploadDialogProps extends DialogProps {

}

export function UploadDialog({
  ...props
}: UploadDialogProps) {
  const { copyToClipboard } = useCopyToClipboard({ timeout: 1000 })
  const [isSharePending, startShareTransition] = React.useTransition()
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false)
  const [fileNames, setFileNames] = React.useState<string[]>([])

  const copyShareLink = React.useCallback(
    async (chat: Chat) => {
      if (!chat.sharePath) {
        return toast.error('Could not copy share link to clipboard')
      }

      const url = new URL(window.location.href)
      url.pathname = chat.sharePath
      copyToClipboard(url.toString())

      toast.success('Share link copied to clipboard')
    },
    [copyToClipboard]
  )

  const onDrop = (acceptedFiles: File[]) => {
    setFileNames(acceptedFiles.map((file) => file.name));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept:  { "text/txt": [".txt"] },
    // onDropAccepted: (files) => {
    //   setFileNames(files.map((file) => file.name));
    // }
  });

  // ...

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            className="size-7 p-0 hover:bg-background"
            onClick={() => setShareDialogOpen(true)}
          >
            <IconShare />
            <span className="sr-only">Uploaden</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Share chat</TooltipContent>
      </Tooltip>
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen} {...props}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload bedrijfsdocumenten</DialogTitle>
            <DialogDescription>
              Hier kunt u uw bedrijfsdocumenten uploaden en beheren.
              Deze zullen worden gebruikt om persoonlijke vragen te beantwoorden in de chat functie en worden gebruikt voor periodieke aanbevelingen.
            </DialogDescription>
          </DialogHeader>
          <Input
            type="file"
            multiple
            {...getInputProps()}
            onChange={(e) => {
              // Update the file names when the user selects files
              if (e.target.files) {
                setFileNames(Array.from(e.target.files).map((file) => file.name));
              }
            }}
          />

          <div {...getRootProps()} className={`p-4 space-y-1 text-sm border-4 border-dashed rounded-md ${isDragActive ? 'bg-gray-200' : ''}`}>
            {/* <div className="font-medium">Upload uw documenten</div> */}
            <input {...getInputProps()} />
            {isDragActive ? (
              <p>Sleep de bestanden hier heen ...</p>
            ) : (
              <p>Sleep uw bestanden hier naartoe of klik hier</p>
            )}
          </div>

          <div className="p-4 space-y-1 text-sm border rounded-md">
            <div className="font-medium">Geselecteerde bestanden</div>
            {/* Display the file names */}
            {fileNames.map((name, index) => (
              <div key={index}>{name}</div>
            ))}
          </div>


          <DialogFooter className="items-center">
            <Button
              disabled={isSharePending}
              onClick={() => {
                // @ts-ignore
                startShareTransition(async () => {
                  const result = await Promise.resolve({ sharePath: 'test' })

                  // if (result && 'error' in result) {
                  //   toast.error(result.error)
                  //   return
                  // }

                  // copyShareLink(result)
                  // toast.success('Share link copied to clipboard')
                })
              }}
            >
              {isSharePending ? (
                <>
                  <IconSpinner className="mr-2 animate-spin" />
                  {/* Uploading... */}
                </>
              ) : (
                <>Uploaden</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >
    </>
  )
}
