import { PublicLayoutClient } from './public-layout-client'

type PublicLayoutProps = {
  children: React.ReactNode
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return <PublicLayoutClient>{children}</PublicLayoutClient>
}
