'use client'

import React, { useEffect, useImperativeHandle, forwardRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import FontFamily from '@tiptap/extension-font-family'
import TextAlign from '@tiptap/extension-text-align'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  content?: string
  placeholder?: string
  onChange?: (content: string) => void
  onBlur?: () => void
  className?: string
  readonly?: boolean
  minHeight?: string
}

export interface RichTextEditorRef {
  focus: () => void
  getHTML: () => string
  setContent: (content: string) => void
  insertText: (text: string) => void
}

const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(({
  content = '',
  placeholder = 'Start typing...',
  onChange,
  onBlur,
  className,
  readonly = false,
  minHeight = '200px'
}, ref) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        }
      }),
      TextStyle,
      Color,
      FontFamily,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content,
    editable: !readonly,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    onBlur: () => {
      onBlur?.()
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
          'min-h-[200px] p-4 border-0'
        ),
      },
    },
  })

  useImperativeHandle(ref, () => ({
    focus: () => editor?.commands.focus(),
    getHTML: () => editor?.getHTML() || '',
    setContent: (content: string) => editor?.commands.setContent(content),
    insertText: (text: string) => editor?.commands.insertContent(text),
  }))

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  if (!editor) {
    return (
      <div 
        className={cn(
          'border border-gray-200 rounded-lg p-4 bg-gray-50 animate-pulse',
          className
        )}
        style={{ minHeight }}
      >
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    )
  }

  return (
    <div className={cn('border border-gray-200 rounded-lg bg-white', className)}>
      {!readonly && (
        <div className="border-b border-gray-200 p-2 flex flex-wrap gap-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Bold"
          >
            <strong>B</strong>
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic"
          >
            <em>I</em>
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            title="Underline"
          >
            <u>U</u>
          </ToolbarButton>
          
          <div className="w-px h-6 bg-gray-200 mx-1" />
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            H1
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            H2
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="Heading 3"
          >
            H3
          </ToolbarButton>
          
          <div className="w-px h-6 bg-gray-200 mx-1" />
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            •
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Numbered List"
          >
            1.
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            isActive={editor.isActive('taskList')}
            title="Task List"
          >
            ☑
          </ToolbarButton>
          
          <div className="w-px h-6 bg-gray-200 mx-1" />
          
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            title="Align Left"
          >
            ←
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            title="Align Center"
          >
            ↔
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            title="Align Right"
          >
            →
          </ToolbarButton>
          
          <div className="w-px h-6 bg-gray-200 mx-1" />
          
          <select
            onChange={(e) => {
              if (e.target.value === 'default') {
                editor.chain().focus().unsetFontFamily().run()
              } else {
                editor.chain().focus().setFontFamily(e.target.value).run()
              }
            }}
            className="px-2 py-1 text-xs border border-gray-200 rounded"
          >
            <option value="default">Font</option>
            <option value="Inter">Inter</option>
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times</option>
            <option value="Courier New">Courier</option>
          </select>
          
          <input
            type="color"
            onInput={(e) => editor.chain().focus().setColor(e.currentTarget.value).run()}
            value={editor.getAttributes('textStyle').color || '#000000'}
            className="w-8 h-6 border border-gray-200 rounded cursor-pointer"
            title="Text Color"
          />
        </div>
      )}
      
      <div style={{ minHeight }}>
        <EditorContent 
          editor={editor} 
          className={cn(
            'prose prose-sm max-w-none p-4',
            readonly && 'prose-gray'
          )}
        />
      </div>
      
      {editor.isEmpty && (
        <div className="absolute top-16 left-4 text-gray-400 pointer-events-none text-sm">
          {placeholder}
        </div>
      )}
    </div>
  )
})

RichTextEditor.displayName = 'RichTextEditor'

interface ToolbarButtonProps {
  onClick: () => void
  isActive: boolean
  title: string
  children: React.ReactNode
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ 
  onClick, 
  isActive, 
  title, 
  children 
}) => (
  <button
    onClick={onClick}
    title={title}
    className={cn(
      'px-2 py-1 text-xs rounded border transition-colors',
      isActive 
        ? 'bg-blue-100 border-blue-300 text-blue-700' 
        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
    )}
  >
    {children}
  </button>
)

export default RichTextEditor