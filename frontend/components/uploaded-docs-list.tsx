'use client'

import { listCompanyDocuments, deleteCompanyDocument, downloadCompanyDocument } from '@/lib/serverfunctions/storage-actions';
import { type DialogProps } from '@radix-ui/react-dialog';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import * as m from "@/paraglide/messages";

interface UploadedDocsListProps extends DialogProps {
    uploadCount: number;
}

export function UploadedDocsList({
    uploadCount,
    ...props
}: UploadedDocsListProps) {
    const [fileList, setFileList] = useState<string[]>([]);

    useEffect(() => {
        console.log('Fetching files');
        // Create a new instance of the Storage client
        listCompanyDocuments().then((files) => {
            setFileList(files);
        });
    }, [uploadCount]);

    // Return a pretty table with the file names and a delete button and a download button
    return (
        <>
            {fileList.length === 0 ? (
                <p>{m.component_uploadeddocslist_nofiles()}</p>
            ) : (
                <table className="w-full">
                    <thead>
                        <tr>
                            <th className="text-left">{m.component_uploadeddocslist_filename()}</th>
                            <th className="text-right">{m.component_uploadeddocslist_actions()}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {fileList.map((fileName) => (
                            <tr key={fileName}>
                                <td className="text-left">{fileName}</td>
                                <td className="text-right">
                                    <button className="text-red-600 hover:text-red-800" onClick={() => {
                                        // Delete the file
                                        deleteCompanyDocument(fileName);
                                        // Update the file list
                                        setFileList(fileList.filter((file) => file !== fileName));
                                        toast.success(m.component_uploadeddocslist_deletesuccess({ fileName }));
                                    }}>{m.component_uploadeddocslist_delete()}</button>
                                    <button className="ml-2 text-blue-600 hover:text-blue-800" onClick={() => {
                                        // Download the file
                                        downloadCompanyDocument(fileName).then((url) => {
                                            if (!url) {
                                                console.error('Error downloading file');
                                                return;
                                            }
                                            // Open the link in a new tab
                                            window.open(url, '_blank');
                                        });
                                    }}>{m.component_uploadeddocslist_download()}</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </>
    );
}