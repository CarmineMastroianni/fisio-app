import { useState } from "react";
import { FileText, Trash2 } from "lucide-react";
import { Button } from "../../../components/Button";
import { Card } from "../../../components/Card";
import { useAddDocumentMutation, useDeleteDocumentMutation, useDocuments } from "../../../hooks/useData";
import type { PatientDocument } from "../../../types";

const readFile = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

type DocumentsPanelProps = {
  patientId: string;
};

export const DocumentsPanel = ({ patientId }: DocumentsPanelProps) => {
  const { data: documents = [] } = useDocuments(patientId);
  const { mutate: addDocument } = useAddDocumentMutation();
  const { mutate: deleteDocument } = useDeleteDocumentMutation();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const dataUrl = await readFile(file);
    const payload: PatientDocument = {
      id: crypto.randomUUID(),
      patientId,
      name: file.name,
      dataUrl,
      size: file.size,
      createdAt: new Date().toISOString(),
    };
    addDocument(payload);
    setUploading(false);
    event.target.value = "";
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Documenti paziente</h3>
            <p className="text-xs text-slate-500">Carica e archivia referti e allegati.</p>
          </div>
          <label className="inline-flex cursor-pointer items-center rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">
            Carica file
            <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
        <div className="mt-4 space-y-3">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="font-semibold text-slate-800">{doc.name}</p>
                  <p className="text-xs text-slate-500">{Math.round(doc.size / 1024)} KB</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  className="text-xs font-semibold text-teal-600"
                  href={doc.dataUrl}
                  download={doc.name}
                >
                  Download
                </a>
                <Button size="sm" variant="ghost" onClick={() => deleteDocument({ id: doc.id, patientId })}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {documents.length === 0 ? (
            <p className="text-sm text-slate-500">Nessun documento archiviato.</p>
          ) : null}
        </div>
      </Card>
    </div>
  );
};
