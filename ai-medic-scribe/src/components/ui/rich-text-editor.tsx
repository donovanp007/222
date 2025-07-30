'use client'

import React from 'react'
import { Textarea } from '@/components/ui/textarea'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  minHeight?: string
  placeholder?: string
}

interface RichTextEditorRef {
  getContent: () => string
  setContent: (content: string) => void
}

export const RichTextEditor = React.forwardRef<RichTextEditorRef, RichTextEditorProps>(
  ({ content, onChange, minHeight = '100px', placeholder = 'Enter text...' }, ref) => {
    React.useImperativeHandle(ref, () => ({
      getContent: () => content,
      setContent: (newContent: string) => onChange(newContent)
    }))

    return (
      <Textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ minHeight }}
        className="w-full p-2 border border-gray-200 rounded-md"
      />
    )
  }
)

RichTextEditor.displayName = 'RichTextEditor'

export default RichTextEditor
