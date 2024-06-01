interface TenderDetailLayoutProps {
  children: React.ReactNode
}

export default async function TenderDetailLayout({ children }: TenderDetailLayoutProps) {
  return (
    <div className="relative flex h-[calc(100vh_-_theme(spacing.16))] overflow-hidden">
      {children}

    </div>
  )
}
