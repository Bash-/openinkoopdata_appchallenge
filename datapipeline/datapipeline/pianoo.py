import json
import re
from dataclasses import dataclass
from typing import List

import requests
from bs4 import BeautifulSoup


@dataclass
class PianooLink:
    url: str
    title: str
    description: str
    content: str

    def __eq__(self, other):
        return self.url == other.url


PIANO_SITEMAP_URL = "https://www.pianoo.nl/nl/sitemap"


def is_ignored(link: str) -> bool:
    """If a link matches a pattern that we don't want, return false

    Args:
        link (str): href link from pianoo

    Returns:
        bool: true if we scrape the link
    """
    IGNORED_LINKS = [
        r"^#$",
        r"^/nl/formulier/.*$",
        r"^/nl/nieuwsbrieven/.*$",
        r"^/nl/archive/.*$",
        r"^/nl/actueel/.*$",
        r"^mailto:.*$",
        r"^https://((www\.linkedin\.com)|(twitter\.com)).*$",
        r"^/nl/sitemap$",
        r"^/nl/archief$",
        r"^/nl/privacy$",
        r"^/nl/nieuwsbrieven-aanmelden$",
        r"^/nl/help-0$",
        r"^/nl/rss",
        r"^/en.*$",
        r"^#.*",
        r"^nl/$",
        r"https://(?:www.)pianoo.nl/.*#.*^",  # internal links
        r"^((?!pianoo).)*$",  # external links
    ]
    for pattern in IGNORED_LINKS:
        if re.match(pattern, link):
            return True
    return False


# TODO: stop condition?
def scrape_links(
    link: str, visited_links: List[str] = None, links_to_return: List[PianooLink] = None
) -> List[PianooLink]:
    """Recursively scrape links from pianoo

    Args:
        link (str): the current page
        visited_links (List[str], optional): list of links already visited
        links_to_return (List[PianooLink], optional): recursively carried scraped data

    Returns:
        List[PianooLink]: scraped data
    """
    if visited_links is None:
        visited_links = set()
    if links_to_return is None:
        links_to_return = []

    if len(links_to_return) > 1000:
        return links_to_return

    if link in visited_links or is_ignored(link) or f"{link}/" in visited_links:
        return links_to_return

    visited_links.add(link)
    try:
        response = requests.get(link)
    except requests.exceptions.MissingSchema as e:
        print(f"{link} was not a correct link")
        return links_to_return

    soup = BeautifulSoup(response.text, "html.parser")
    links = soup.find_all("a", href=True)

    # the content of the page is in a div with role="article"
    page_content = soup.find("div", {"role": "article"})
    if page_content:
        page_content = page_content.get_text()
    else:
        paragraphs = soup.find_all("p")
        page_content = " ".join(p.get_text() for p in paragraphs)

    page_title = soup.title.string if soup.title else "No title"
    page_description = soup.description.string if soup.description else "No description"

    print(f"Scraping: {link}, Title: {page_title}")
    # print("Content:", page_content)

    # Add the current page to the list of PianooLink objects
    links_to_return.append(
        PianooLink(
            url=link,
            title=page_title,
            content=page_content,
            description=page_description,
        )
    )

    # Filter and scrape links found on the current page
    found_links = [l["href"] for l in links if not is_ignored(l["href"])]
    for new_link in found_links:
        if new_link.startswith("/nl"):
            new_link = f"https://www.pianoo.nl{new_link}"

        if new_link not in visited_links and f"{new_link}/" not in visited_links:
            # Recursively scrape the new link and extend the result list
            links_to_return = scrape_links(new_link, visited_links, links_to_return)

    return links_to_return


if __name__ == "__main__":
    # Start recursive scraping
    data = scrape_links(
        PIANO_SITEMAP_URL,
    )

    with open("./pianoo/links.json", "w+") as f:
        f.write(json.dumps({"links": [c.url for c in data]}))

    for content in data:
        with open(
            f"./pianoo/{content.url.replace('https://www.pianoo.nl/', '').replace('/', '_')}.json",
            "w+",
        ) as f:
            f.write(
                json.dumps(
                    {
                        "title": content.title,
                        "url": content.url,
                        "content": content.content,
                    }
                )
            )
