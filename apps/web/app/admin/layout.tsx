import './admin-global.css'
import './admin-icons.css'
import { themeBootScript } from './ThemeToggle'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>
    {/* Runs before paint so a dark session never flashes light first. */}
    <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
    {children}
  </>
}
