"use client"

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { EnterFullScreenIcon, ExitFullScreenIcon } from '@radix-ui/react-icons';

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
            {emptyScreenHeader || 'Welkom bij de TenderFlow chatbot!'}
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
                  Dit is een open source chatbot dat vragen kan beantwoorden over aanbestedingen van het Rijk.
                  {/* Stel gerust een vraag of probeer een van de voorbeelden hieronder. */}
                </div>
                <div className="leading-normal text-muted-foreground">
                  Klik hieronder om relevante Tenders en Rijksdocumenten te bekijken en vragen over te stellen.
                </div>
                <div className="leading-normal text-muted-foreground">
                  Het AI model beantwoord vragen op basis van een onderliggende dataset met actuele aanbestedingsdata van het Rijk,
                  en kan vragen beantwoorden over onderwerpen zoals categorieplannen, inkoopstrategieën en tenderdocumenten.
                </div>
                <div className="leading-normal text-muted-foreground">
                  Doordat de chatbot alleen vragen kan beantwoorden op basis van geselecteerde documenten die door onze applicatie
                  zijn ingeladen, zou de chatbot geen antwoorden moeten verzinnen, maar altijd het antwoord baseren op de onderliggende bron.
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}