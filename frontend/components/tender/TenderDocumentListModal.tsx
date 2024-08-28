import { Document } from '@langchain/core/documents';
import * as Checkbox from '@radix-ui/react-checkbox';
import * as Dialog from '@radix-ui/react-dialog';
import { CheckIcon, Cross2Icon, DownloadIcon } from '@radix-ui/react-icons';
import { memo, useEffect, useState } from 'react';
import styles from './TenderDocumentListModal.module.css';

// right now we have not documentid but <documentnaam>.<typedocument>
const returnDocumentId = (document: Document) => {
  const sourceTypeToExtension = (string) => {
    if (string === 'application/pdf' || string === 'Portable Document Format' || string.toLowerCase().indexOf('pdf') > -1) {
      return 'pdf';
    }
    if (string === 'application/msword' || string === 'Microsoft Word' || string.toLowerCase().indexOf('word') > -1) {
      return 'doc';
    }
    if (string === 'Excel' || string.toLowerCase().indexOf('excel') > -1) {
      return 'xls';
    }
    if (string === 'txt') {
      return 'txt'
    }
    return 'unknown';
  }

  if (document.documentnaam?.toLowerCase().indexOf('pianoo') > -1 || document.documentid.indexOf('pianoo') > -1) {
    return `${document.documentid.replace('pianoo', '')}.${sourceTypeToExtension(document.typedocument)}`;
  }
  return `${document.documentnaam}.${sourceTypeToExtension(document.typedocument)}`;
};

const TenderDocumentListModal = memo((
  { tenderId, documents, onSelectionChange } :
  { tenderId: string, documents: Document[], onSelectionChange: (documentIds: string[]) => void }
) => {
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>(documents.map(returnDocumentId));

  const handleToggleDocument = (id: string) => {
    setSelectedDocuments((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((docId) => docId !== id)
        : [...prevSelected, id]
    );
  };

  useEffect(() => {
    console.log('Selected documents:', documents, selectedDocuments);
    onSelectionChange(selectedDocuments);
  }, [selectedDocuments, onSelectionChange]);

  // Handler for Select All
  const handleSelectAll = () => {
    setSelectedDocuments(documents.map(returnDocumentId));
  };

  // Handler for Deselect All
  const handleDeselectAll = () => {
    setSelectedDocuments([]);
  };

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className={styles.selectButton}>
          Selecteer subset van documenten
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.dialogOverlay} />
        <Dialog.Content className={styles.dialogContent}>
          <Dialog.Title className={styles.dialogTitle}>Selecteer relevante documenten</Dialog.Title>
          <Dialog.Description className={styles.dialogDescription}>
            De documenten in deze lijst worden gebruikt als context voor uw vragen. Als u een vraag heeft over specifieke documenten kunt u deze selecteren.
          </Dialog.Description>
          <div className={styles.selectButtons}>
            <button onClick={handleSelectAll} className={styles.button}>
              Selecteer alle
            </button>
            <button onClick={handleDeselectAll} className={styles.button}>
              Deselecteer alle
            </button>
          </div>
          <fieldset className={styles.fieldset}>
            {documents.map((document, index) => (
              <div key={document.documentid} className={styles.checkboxContainer}>
                <Checkbox.Root className={styles.checkboxRoot}
                  key={document.documentid}
                  id={`doc-${document.documentid}`}
                  checked={selectedDocuments.includes(returnDocumentId(document))}
                  onCheckedChange={() => handleToggleDocument(returnDocumentId(document))}
                >
                  <Checkbox.Indicator className={styles.checkboxIndicator}>
                    <CheckIcon />
                  </Checkbox.Indicator>
                </Checkbox.Root>
                <label className={styles.label} htmlFor={`doc-${document.documentid}`}>
                  {document.documentnaam}
                </label>
                <DownloadIcon className={styles.downloadIcon} onClick={
                  () => {
                    let url = ''
                    if (document.downloadurl?.indexOf('papi') > -1) {
                      url = `https://www.tenderned.nl${document.downloadurl}`;
                    }
                    else {
                      url = document.downloadurl;
                    }
                    window.open(url, '_blank');
                  }
                } />
              </div>
            ))}
          </fieldset>
          {/* <div style={{ display: 'block', position: 'fixed', bottom: 0, left: 0, right: 0}}>
            <Dialog.Close asChild>
              <button className={`${styles.button} ${styles.violet}`}>Doorgaan met chatten</button>
            </Dialog.Close>
          </div> */}
          <Dialog.Close asChild>
            <button className="text-violet11 hover:bg-violet4 focus:shadow-violet7 absolute top-[10px] right-[10px] inline-flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-full focus:shadow-[0_0_0_2px] focus:outline-none" aria-label="Close">
              <Cross2Icon />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}, (prevProps, nextProps) => prevProps.tenderId === nextProps.tenderId && prevProps.documents.length === nextProps.documents.length);

TenderDocumentListModal.displayName = 'TenderDocumentListModal';

export default TenderDocumentListModal;