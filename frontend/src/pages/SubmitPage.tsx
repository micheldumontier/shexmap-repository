import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Editor from '@monaco-editor/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateShExMap } from '../api/shexmaps.js';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  sourceSchemaUrl: z.string().url('Must be a valid URL'),
  targetSchemaUrl: z.string().url('Must be a valid URL'),
  tags: z.string().optional(), // comma-separated
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Use semver format: 1.0.0').default('1.0.0'),
  license: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

export default function SubmitPage() {
  const [content, setContent] = useState('');
  const [contentError, setContentError] = useState('');
  const navigate = useNavigate();
  const createMap = useCreateShExMap();

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { version: '1.0.0' },
  });

  const onSubmit = async (values: FormValues) => {
    if (!content.trim()) {
      setContentError('ShExMap content is required');
      return;
    }
    setContentError('');

    const tags = values.tags
      ? values.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const result = await createMap.mutateAsync({
      ...values,
      content,
      tags,
      license: values.license || undefined,
    });

    navigate(`/maps/${result.id}`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Submit a ShExMap</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Field label="Title *" error={errors.title?.message}>
          <input {...register('title')} className={inputCls} placeholder="My ShExMap" />
        </Field>

        <Field label="Description" error={errors.description?.message}>
          <textarea {...register('description')} rows={3} className={inputCls} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Source Schema URL *" error={errors.sourceSchemaUrl?.message}>
            <input {...register('sourceSchemaUrl')} className={inputCls} placeholder="https://..." />
          </Field>
          <Field label="Target Schema URL *" error={errors.targetSchemaUrl?.message}>
            <input {...register('targetSchemaUrl')} className={inputCls} placeholder="https://..." />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Version" error={errors.version?.message}>
            <input {...register('version')} className={inputCls} placeholder="1.0.0" />
          </Field>
          <Field label="Tags (comma-separated)">
            <input {...register('tags')} className={inputCls} placeholder="fhir, wikidata, biomedical" />
          </Field>
        </div>

        <Field label="License URL">
          <input {...register('license')} className={inputCls} placeholder="https://spdx.org/licenses/Apache-2.0.html" />
        </Field>

        <Field label="ShExMap Content *" error={contentError}>
          <div className="rounded-lg border border-gray-300 overflow-hidden">
            <Editor
              height="350px"
              defaultLanguage="turtle"
              value={content}
              onChange={(val) => setContent(val ?? '')}
              options={{ minimap: { enabled: false }, scrollBeyondLastLine: false }}
              theme="vs"
            />
          </div>
        </Field>

        {createMap.isError && (
          <div className="text-red-600 text-sm">
            Submission failed. Please check your ShExMap content and try again.
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50">
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMap.isPending}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {createMap.isPending ? 'Submitting...' : 'Submit ShExMap'}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500';

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
