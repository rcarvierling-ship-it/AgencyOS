import './admin-global.css'
import './admin-icons.css'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>
    <link rel="stylesheet" href="https://unicons.iconscout.com/release/v4.0.8/css/line.css" />
    {children}
  </>
}
