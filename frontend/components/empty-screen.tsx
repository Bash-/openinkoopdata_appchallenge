"use client"

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { EnterFullScreenIcon, ExitFullScreenIcon } from '@radix-ui/react-icons';
import * as m from "@/paraglide/messages";

export function EmptyScreen({ emptyScreenHeader, emptyScreenBody, collapsed = false }: { emptyScreenHeader?: string, emptyScreenBody?: string | JSX.Element, collapsed?: boolean }) {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // listen to collapsed change ansd set state
  useEffect(() => {
    console.log('collapsed', collapsed);
    setIsCollapsed(collapsed);
  }
    , [collapsed]);

  return (
    <div className="mx-auto max-w-2xl px-4 mb-5">
      <div className="flex flex-col gap-2 rounded-lg border bg-background p-8 relative">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-semibold">
            {emptyScreenHeader || m.component_emptyscreen_welcome()}
          </h1>
          <Button
            className="absolute top-2 right-2 p-1"
            variant="outline"
            size="sm"
            onClick={toggleCollapse}
          >
            {isCollapsed ? <EnterFullScreenIcon /> : <ExitFullScreenIcon />}
          </Button>
        </div>

        {!isCollapsed && (
          <>
            {emptyScreenBody ? (
              <div className="leading-normal text-muted-foreground">
                {emptyScreenBody}
              </div>
            ) : (
              <>
                <div className="leading-normal text-muted-foreground">
                  {m.component_emptyscreen_description1()}
                </div>
                <div className="leading-normal text-muted-foreground">
                  {m.component_emptyscreen_description2()}
                </div>
                <div className="leading-normal text-muted-foreground">
                  {m.component_emptyscreen_contact()}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}