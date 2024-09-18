
import { Button } from '@/components/ui/button'
import { setLanguageTag } from "@/paraglide/runtime.js"

export function LanguageButton() {

    const handleDelete = async (data: FormData) => {
        "use server";
        console.log(data)
        const itemId = data.get("itemId");
        console.log(itemId)
        setLanguageTag("de" /* en */)
    };
    

    return (
        <>
            <form action={handleDelete}>
                <input name="itemId" className="hidden" value={'en'} />
                <button type="submit">English</button>
            </form>
            <form action={handleDelete}>
                <input name="itemId" className="hidden" value={'nl'} />
                <button type="submit">Nederlands</button>
            </form>
        </>
    )
}