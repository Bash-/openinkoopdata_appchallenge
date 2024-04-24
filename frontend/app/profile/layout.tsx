import { SidebarDesktop } from '@/components/sidebar-desktop'
import { cn } from '@/lib/utils'

interface ChatLayoutProps {
  children: React.ReactNode
}

export default async function ProfileLayout({ children }: ChatLayoutProps) {
  return (
    <div className="relative flex h-[calc(100vh_-_theme(spacing.16))] overflow-hidden">
      <SidebarDesktop />
      <div
        className="group w-full overflow-auto pl-0 peer-[[data-state=open]]:lg:pl-[250px] peer-[[data-state=open]]:xl:pl-[300px]"
      >
        <div
          className={cn('pb-[200px] pt-4 md:pt-10')}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
