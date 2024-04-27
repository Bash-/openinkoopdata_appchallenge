'use client'
import { type DialogProps } from '@radix-ui/react-dialog';
import * as React from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { IconShare, IconSpinner } from '@/components/ui/icons';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { uploadFiles } from '@/lib/serverfunctions/storage-actions';
import { Input } from './ui/input';

interface UploadDialogProps extends DialogProps {

}

export function UploadDialog({
  ...props
}: UploadDialogProps) {
  const [isSharePending, startShareTransition] = React.useTransition()
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false)
  const [fileNames, setFileNames] = React.useState<string[]>([])
  const [files, setFiles] = React.useState<File[]>([])

  const onDrop = (acceptedFiles: File[]) => {
    setFileNames(acceptedFiles.map((file) => file.name));
    setFiles(acceptedFiles);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { "text/txt": [".txt"] }
  });

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
          <form>
            <Input
              type="file"
              // multiple
              {...getInputProps()}
              onChange={(e) => {
                // Update the file names when the user selects files
                if (e.target.files) {
                  setFileNames(Array.from(e.target.files).map((file) => file.name));
                  setFiles(Array.from(e.target.files));
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
          </form>

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
                  let formData = new FormData();
                  files.forEach(file => {
                    formData.append('file', file);
                  });

                  let file = formData.get('file') as File

                  let res = uploadFiles(formData).then(x => {
                    toast.success('Uploaden van bestand(en) gelukt')
                    setShareDialogOpen(false)
                  })
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
