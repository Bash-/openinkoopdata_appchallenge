import * as m from "@/paraglide/messages"
// import { useScrollAnchor } from '@/lib/hooks/use-scroll-anchor'
import { LogoOpenStateFoundation } from '@/components/ui/icons'

import { Link } from "@/lib/i18n"

export default async function AboutPage() {

  // const { messagesRef, scrollRef, visibilityRef, isAtBottom, scrollToBottom } = useScrollAnchor()

  return (

    <div className="relative mx-auto max-w-2xl px-4">

      <h1 className="text-lg font-semibold">{m.aboutPage_title()}</h1>
      <p className="leading-normal text-muted-foreground">
        {m.aboutPage_description1()}
      </p>

      <p>
        {m.aboutPage_contact()} <a className="underline" href="mailto:info@tenderflow.eu">{m.aboutPage_email()}</a>
      </p>
      <p className="leading-normal text-muted-foreground">
        {m.aboutPage_description2()}
      </p>

      <br></br>
      <p className="leading-normal text-muted-foreground">
        {m.aboutPage_challengeDescription()} <Link className="underline" href="https://www.rijksoverheid.nl/onderwerpen/zakendoen-met-het-rijk/kick-off-open-inkoopdata-app-challenge">{m.aboutPage_challengeLinkText()}</Link>. 
        {m.aboutPage_githubDescription()} <Link className="underline" href="https://github.com/Bash-/openinkoopdata_appchallenge">{m.aboutPage_githubLinkText()}</Link>.
      </p>
      <br></br>
      <p className="leading-normal text-muted-foreground">
        {m.aboutPage_description3()}
      </p>
      <br></br>

      <h2 className="text-md font-semibold">{m.aboutPage_techTitle()}</h2>

      <p className="leading-normal text-muted-foreground">
        {m.aboutPage_techDescription()} <Link className='underline' href="https://github.com/vercel/ai-chatbot">{m.aboutPage_techLinkText()}</Link>, {m.aboutPage_techLicense()}
      </p>
      <br></br>

      <p className="leading-normal text-muted-foreground">
        {m.aboutPage_dataSources()}
        <ul>
          <li> - {m.aboutPage_dataSource1()} </li>
          <li> - {m.aboutPage_dataSource2()} </li>
          <li> - {m.aboutPage_dataSource3()} </li>
          <li> - {m.aboutPage_dataSource4()} </li>
        </ul>
      </p>
      <br></br>

      <p className="leading-normal text-muted-foreground">
        {m.aboutPage_ragDescription()}
      </p>

      <br></br>

      <h2 className="text-md font-semibold">{m.aboutPage_initiatorsTitle()}</h2>
      <p className="leading-normal text-muted-foreground">
        {m.aboutPage_initiatorsDescription()} <Link className="underline" href="https://openstate.eu/">{m.aboutPage_initiatorsLinkText()}</Link>.
      </p>
      <br></br>
      <br></br>
      <LogoOpenStateFoundation className="w-24 h-24" />

    </div>
  )
}