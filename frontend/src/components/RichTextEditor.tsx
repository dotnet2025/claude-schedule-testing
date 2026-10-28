import { useEffect, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import { Box, Divider, IconButton, MenuItem, Paper, Select, Stack, Tooltip } from '@mui/material'
import { alpha } from '@mui/material/styles'
import FormatBold from '@mui/icons-material/FormatBold'
import FormatItalic from '@mui/icons-material/FormatItalic'
import FormatUnderlined from '@mui/icons-material/FormatUnderlined'
import StrikethroughS from '@mui/icons-material/StrikethroughS'
import FormatListBulleted from '@mui/icons-material/FormatListBulleted'
import FormatListNumbered from '@mui/icons-material/FormatListNumbered'
import FormatQuote from '@mui/icons-material/FormatQuote'
import FormatAlignLeft from '@mui/icons-material/FormatAlignLeft'
import FormatAlignCenter from '@mui/icons-material/FormatAlignCenter'
import FormatAlignRight from '@mui/icons-material/FormatAlignRight'
import LinkIcon from '@mui/icons-material/Link'
import ImageIcon from '@mui/icons-material/Image'
import TableChart from '@mui/icons-material/TableChart'
import Code from '@mui/icons-material/Code'
import Undo from '@mui/icons-material/Undo'
import Redo from '@mui/icons-material/Redo'
import MediaPicker from '../features/media/MediaPicker'

interface Props { value: string; onChange: (html: string) => void; label?: string }

export default function RichTextEditor({ value, onChange, label = 'Content' }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const editor = useEditor({
    extensions: [
      StarterKit, Underline, Link.configure({ openOnClick: false }), Image,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: false }), TableRow, TableHeader, TableCell,
    ],
    content: value,
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
    editorProps: { attributes: { 'aria-label': label, role: 'textbox', 'aria-multiline': 'true', class: 'cms-editor' } },
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) editor.commands.setContent(value, { emitUpdate: false })
  }, [value, editor])

  if (!editor) return null
  const btn = (title: string, icon: React.ReactNode, action: () => void, active = false) => (
    <Tooltip title={title} key={title}>
      <IconButton size="small" aria-label={title} aria-pressed={active} color={active ? 'primary' : 'default'} onClick={action} sx={{ borderRadius: 1.5, bgcolor: active ? (t) => alpha(t.palette.primary.main, 0.12) : 'transparent' }}>{icon}</IconButton>
    </Tooltip>
  )
  const setLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Link URL', prev ?? 'https://')
    if (url === null) return
    if (url === '') editor.chain().focus().unsetLink().run()
    else editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }
  const heading = editor.isActive('heading') ? String(editor.getAttributes('heading').level) : '0'

  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', '&:focus-within': { borderColor: 'primary.main', boxShadow: (t) => `0 0 0 3px ${alpha(t.palette.primary.light, 0.25)}` } }}>
      <Stack direction="row" flexWrap="wrap" alignItems="center" useFlexGap gap={0.25} sx={{ p: 1, borderBottom: 1, borderColor: 'divider', bgcolor: (t) => alpha(t.palette.primary.main, 0.03) }} role="toolbar" aria-label="Formatting">
        <Select size="small" value={heading} inputProps={{ 'aria-label': 'Heading level' }} sx={{ mr: 1, minWidth: 130, '@media (pointer: coarse)': { minHeight: 44 } }}
          onChange={(e) => {
            const lvl = Number(e.target.value)
            if (lvl === 0) editor.chain().focus().setParagraph().run()
            else editor.chain().focus().setHeading({ level: lvl as 1 | 2 | 3 | 4 | 5 | 6 }).run()
          }}>
          <MenuItem value="0">Paragraph</MenuItem>
          {[1, 2, 3, 4, 5, 6].map((l) => <MenuItem key={l} value={String(l)}>Heading {l}</MenuItem>)}
        </Select>
        {btn('Bold', <FormatBold />, () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'))}
        {btn('Italic', <FormatItalic />, () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'))}
        {btn('Underline', <FormatUnderlined />, () => editor.chain().focus().toggleUnderline().run(), editor.isActive('underline'))}
        {btn('Strikethrough', <StrikethroughS />, () => editor.chain().focus().toggleStrike().run(), editor.isActive('strike'))}
        {btn('Bullet list', <FormatListBulleted />, () => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'))}
        {btn('Numbered list', <FormatListNumbered />, () => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'))}
        {btn('Blockquote', <FormatQuote />, () => editor.chain().focus().toggleBlockquote().run(), editor.isActive('blockquote'))}
        {btn('Code block', <Code />, () => editor.chain().focus().toggleCodeBlock().run(), editor.isActive('codeBlock'))}
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        {btn('Align left', <FormatAlignLeft />, () => editor.chain().focus().setTextAlign('left').run())}
        {btn('Align center', <FormatAlignCenter />, () => editor.chain().focus().setTextAlign('center').run())}
        {btn('Align right', <FormatAlignRight />, () => editor.chain().focus().setTextAlign('right').run())}
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        {btn('Link', <LinkIcon />, setLink, editor.isActive('link'))}
        {btn('Insert table', <TableChart />, () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run())}
        {btn('Insert image from media library', <ImageIcon />, () => setPickerOpen(true))}
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        {btn('Undo', <Undo />, () => editor.chain().focus().undo().run())}
        {btn('Redo', <Redo />, () => editor.chain().focus().redo().run())}
      </Stack>
      <Box sx={{ p: { xs: 1.5, sm: 2.5 }, minHeight: 320, bgcolor: 'background.paper', lineHeight: 1.7,
        '& .cms-editor': { outline: 'none', minHeight: 280, overflowWrap: 'anywhere' },
        '& .cms-editor h1, & .cms-editor h2, & .cms-editor h3': { lineHeight: 1.25 },
        '& blockquote': { m: 0, pl: 2, borderLeft: 4, borderColor: 'primary.light', color: 'text.secondary' },
        '& pre': { bgcolor: 'grey.100', p: 1.5, borderRadius: 1, overflowX: 'auto' },
        '& table': { borderCollapse: 'collapse', maxWidth: '100%' }, '& td, & th': { border: 1, borderColor: 'divider', p: 0.75 }, '& img': { maxWidth: '100%', height: 'auto' } }}>
        <EditorContent editor={editor} />
      </Box>
      <MediaPicker open={pickerOpen} imagesOnly onClose={() => setPickerOpen(false)}
        onSelect={(m) => { editor.chain().focus().setImage({ src: m.url, alt: m.originalName }).run(); setPickerOpen(false) }} />
    </Paper>
  )
}
